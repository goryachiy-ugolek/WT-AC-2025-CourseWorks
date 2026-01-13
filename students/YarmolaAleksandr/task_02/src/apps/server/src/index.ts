import app from './app';
import logger from './utils/logger';
import { connectRedis } from './utils/redis';

// Подключение к Redis
connectRedis().catch(err => {
  logger.error('Redis connection failed', { error: err.message });
});

// app.listen(5000, () => console.log('Сервер на http://localhost:5000'));
app.listen(5000, '0.0.0.0', () => {
  logger.info('Server started', { 
    port: 5000, 
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});


export default app;