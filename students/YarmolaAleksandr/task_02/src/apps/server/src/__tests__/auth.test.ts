import request from 'supertest';
import app from '../app';

// Тестовые env переменные
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key';

describe('Auth Routes', () => {
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    name: 'Test User'
  };

  let authToken: string;

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', testUser.email);
      expect(res.body.user).toHaveProperty('name', testUser.name);
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should reject registration with existing email', async () => {
      await request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(400);
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test'
        })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('should reject registration with short password', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'test2@example.com',
          password: '123',
          name: 'Test'
        })
        .expect(400);

      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('6 characters');
    });
  });

  describe('POST /auth/login', () => {
    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      authToken = res.body.token;
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(res.body).toHaveProperty('error');
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /auth/me', () => {
    it('should get current user with valid token', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('email', testUser.email);
      expect(res.body).toHaveProperty('name', testUser.name);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should reject without token', async () => {
      await request(app)
        .get('/auth/me')
        .expect(401);
    });

    it('should reject with invalid token', async () => {
      await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const res = await request(app)
        .post('/auth/logout')
        .expect(200);

      expect(res.body).toHaveProperty('message');
    });
  });
});
