import winston from 'winston';

// Настройка уровней логирования по окружению
const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Форматы для структурированного логирования
const formats = [
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
];

// Добавляем цвета для консоли в development
const consoleFormat = process.env.NODE_ENV === 'production'
  ? winston.format.json()
  : winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
          msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
      })
    );

// Создание logger
const logger = winston.createLogger({
  level,
  format: winston.format.combine(...formats),
  defaultMeta: { service: 'longread-backend' },
  transports: [
    // Консольный вывод
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // Файл для ошибок
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.json(),
    }),
    // Файл для всех логов
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.json(),
    }),
  ],
});

// HTTP request logger middleware
export const httpLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });
  
  next();
};

export default logger;
