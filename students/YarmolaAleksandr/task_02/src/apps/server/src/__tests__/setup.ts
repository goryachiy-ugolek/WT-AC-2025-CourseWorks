// Тестовая база данных для изоляции тестов
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST || 
  'postgresql://appuser:password@localhost:5432/longread_blog_test?schema=public';
process.env.JWT_SECRET = 'test_jwt_secret_key';
process.env.NODE_ENV = 'test';

