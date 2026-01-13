import { Router } from 'express';
import prisma from '../prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { validateEmail, validatePassword } from '../utils/validation';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Валидация
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password and name are required' });
    }
    
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }
    
    // Проверка существующего пользователя
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, role: 'user' }
    });
    
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    
    res.status(201).json({ 
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed', details: err });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Валидация
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    
    res.json({ 
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed', details: err });
  }
});

// Получение профиля текущего пользователя по токену
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        _count: {
          select: { posts: true, comments: true, likes: true }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile', details: err });
  }
});

router.post('/logout', (req, res) => {
  // Если JWT — просто успешно отвечаем, клиент сам удаляет токен из localStorage
  res.json({ message: "Logged out" });
});

export default router;
