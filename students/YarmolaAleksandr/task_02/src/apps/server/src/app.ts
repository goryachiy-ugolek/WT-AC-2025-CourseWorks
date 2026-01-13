import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRouter from './routes/auth';
import postsRouter from './routes/posts';
import tagsRouter from './routes/tags';
import commentsRouter from './routes/comments';
import likesRouter from './routes/likes';
import usersRouter from './routes/users';
import swaggerUi from 'swagger-ui-express';
import swaggerDoc from './swagger.json';
import logger, { httpLogger } from './utils/logger';
import { metricsMiddleware, register, incrementErrors } from './utils/metrics';

const app = express();

// Logging middleware
app.use(httpLogger);

// Metrics middleware
app.use(metricsMiddleware);

// Security & parsing middlewares
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(helmet());
app.use(express.json());

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err: any) {
    logger.error('Error fetching metrics', { error: err.message });
    res.status(500).end(err);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main API routes
app.use('/auth', authRouter);
app.use('/posts', postsRouter);
app.use('/tags', tagsRouter);
app.use('/comments', commentsRouter);
app.use('/likes', likesRouter);
app.use('/users', usersRouter);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// Root endpoint
app.get('/', (req, res) => {
  res.send('API работает!');
});

// 404 for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err : any, req : any, res : any, next : any) => {
  logger.error('Global error', { 
    error: err.message, 
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  incrementErrors('http_error', req.path);
  
  res.status(err.status || 500).json({ error: err.message || 'Internal Error' });
});

export default app;

