import { createClient } from 'redis';
import logger from './logger';

// Создание Redis клиента
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis: Too many reconnect attempts, giving up');
        return new Error('Too many retries');
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

// Обработка событий
redisClient.on('error', (err) => {
  logger.error('Redis Client Error', { error: err.message });
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

redisClient.on('ready', () => {
  logger.info('Redis Client Ready');
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis Client Reconnecting');
});

// Подключение к Redis
export const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connection established');
  } catch (error: any) {
    logger.error('Failed to connect to Redis', { error: error.message });
    // Продолжаем работу без Redis (graceful degradation)
  }
};

// Хелперы для кэширования
export const cacheGet = async (key: string): Promise<any | null> => {
  try {
    if (!redisClient.isOpen) return null;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error: any) {
    logger.error('Redis GET error', { key, error: error.message });
    return null;
  }
};

export const cacheSet = async (key: string, value: any, ttlSeconds: number = 300): Promise<void> => {
  try {
    if (!redisClient.isOpen) return;
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    logger.debug('Redis SET success', { key, ttl: ttlSeconds });
  } catch (error: any) {
    logger.error('Redis SET error', { key, error: error.message });
  }
};

export const cacheDel = async (key: string): Promise<void> => {
  try {
    if (!redisClient.isOpen) return;
    await redisClient.del(key);
    logger.debug('Redis DEL success', { key });
  } catch (error: any) {
    logger.error('Redis DEL error', { key, error: error.message });
  }
};

export const cacheDelPattern = async (pattern: string): Promise<void> => {
  try {
    if (!redisClient.isOpen) return;
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.debug('Redis DEL pattern success', { pattern, count: keys.length });
    }
  } catch (error: any) {
    logger.error('Redis DEL pattern error', { pattern, error: error.message });
  }
};

export default redisClient;
