import { Request, Response, NextFunction } from 'express';
import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';
import logger from './logger';

// Создание реестра метрик
export const register = new Registry();

// Сбор дефолтных метрик (CPU, память, и т.д.)
collectDefaultMetrics({ register });

// Метрика: Счетчик HTTP запросов
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Метрика: Продолжительность HTTP запросов
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

// Метрика: Счетчик ошибок
export const errorsTotal = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'route'],
  registers: [register],
});

// Метрика: Счетчик кэш попаданий/промахов
export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['key_type'],
  registers: [register],
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['key_type'],
  registers: [register],
});

// Middleware для сбора метрик HTTP запросов
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // в секундах
    const route = req.route?.path || req.path;
    const statusCode = res.statusCode.toString();
    
    // Увеличиваем счетчик запросов
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: statusCode,
    });
    
    // Записываем продолжительность
    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: statusCode,
      },
      duration
    );
    
    // Логируем медленные запросы
    if (duration > 1) {
      logger.warn('Slow request detected', {
        method: req.method,
        route,
        duration: `${duration}s`,
      });
    }
  });
  
  next();
};

// Функция для инкремента ошибок
export const incrementErrors = (type: string, route: string) => {
  errorsTotal.inc({ type, route });
};

// Функция для инкремента кэш метрик
export const incrementCacheHits = (keyType: string) => {
  cacheHits.inc({ key_type: keyType });
};

export const incrementCacheMisses = (keyType: string) => {
  cacheMisses.inc({ key_type: keyType });
};

logger.info('Prometheus metrics configured');
