import request from 'supertest';
import app from '../app';

// Тестовые env переменные
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key';

describe('Posts Routes', () => {
  let authToken: string;
  let userId: number;
  let postId: number;

  beforeAll(async () => {
    // Регистрация тестового пользователя
    const res = await request(app)
      .post('/auth/register')
      .send({
        email: `posttest${Date.now()}@example.com`,
        password: 'password123',
        name: 'Post Test User'
      });
    
    authToken = res.body.token;
    userId = res.body.user.id;
  });

  describe('GET /posts', () => {
    it('should get all published posts', async () => {
      const res = await request(app)
        .get('/posts')
        .expect(200);

      expect(res.body).toHaveProperty('posts');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.posts)).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/posts?page=1&limit=5')
        .expect(200);

      expect(res.body.pagination).toHaveProperty('page', 1);
      expect(res.body.pagination).toHaveProperty('limit', 5);
      expect(res.body.pagination).toHaveProperty('total');
      expect(res.body.pagination).toHaveProperty('totalPages');
    });

    it('should support search filter', async () => {
      const res = await request(app)
        .get('/posts?search=test')
        .expect(200);

      expect(res.body).toHaveProperty('posts');
    });
  });

  describe('POST /posts', () => {
    it('should create a new post when authenticated', async () => {
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Post',
          content: '# Test Content\nThis is a test post.',
          published: true
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('title', 'Test Post');
      expect(res.body).toHaveProperty('published', true);
      expect(res.body).toHaveProperty('authorId', userId);
      
      postId = res.body.id;
    });

    it('should reject post creation without authentication', async () => {
      await request(app)
        .post('/posts')
        .send({
          title: 'Unauthorized Post',
          content: 'Content'
        })
        .expect(401);
    });

    it('should reject post with empty title', async () => {
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '',
          content: 'Content'
        })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('should reject post with empty content', async () => {
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Title',
          content: ''
        })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('should create draft when published is false', async () => {
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Draft Post',
          content: 'Draft content',
          published: false
        })
        .expect(201);

      expect(res.body).toHaveProperty('published', false);
    });
  });

  describe('GET /posts/:id', () => {
    it('should get a specific post by id', async () => {
      const res = await request(app)
        .get(`/posts/${postId}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', postId);
      expect(res.body).toHaveProperty('title');
      expect(res.body).toHaveProperty('content');
      expect(res.body).toHaveProperty('author');
    });

    it('should return 404 for non-existent post', async () => {
      await request(app)
        .get('/posts/999999')
        .expect(404);
    });
  });

  describe('PUT /posts/:id', () => {
    it('should update own post', async () => {
      const res = await request(app)
        .put(`/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
          content: 'Updated content'
        })
        .expect(200);

      expect(res.body).toHaveProperty('title', 'Updated Title');
      expect(res.body).toHaveProperty('content', 'Updated content');
    });

    it('should reject update without authentication', async () => {
      await request(app)
        .put(`/posts/${postId}`)
        .send({
          title: 'Unauthorized Update'
        })
        .expect(401);
    });
  });

  describe('GET /posts/drafts', () => {
    it('should get user drafts when authenticated', async () => {
      const res = await request(app)
        .get('/posts/drafts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('drafts');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.drafts)).toBe(true);
    });

    it('should reject drafts request without authentication', async () => {
      await request(app)
        .get('/posts/drafts')
        .expect(401);
    });
  });

  describe('DELETE /posts/:id', () => {
    it('should delete own post', async () => {
      await request(app)
        .delete(`/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should return 404 after deletion', async () => {
      await request(app)
        .get(`/posts/${postId}`)
        .expect(404);
    });

    it('should reject deletion without authentication', async () => {
      await request(app)
        .delete(`/posts/${postId}`)
        .expect(401);
    });
  });
});
