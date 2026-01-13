import { Router } from 'express';
import prisma from '../prisma/client';
import bcrypt from 'bcrypt';
import { authMiddleware, adminOnly, AuthRequest } from '../middlewares/auth';
import { validateEmail, validatePassword } from '../utils/validation';

const router = Router();

// Получить всех пользователей (только admin)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
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
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users', details: err });
  }
});

// Получить пользователя по id (только admin)
router.get('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        posts: { select: { id: true, title: true, published: true, createdAt: true } },
        comments: { select: { id: true, content: true, createdAt: true } },
        likes: { select: { id: true, postId: true } }
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user', details: err });
  }
});

// Обновить пользователя (только admin) - изменение роли, email, имени
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { email, name, role } = req.body;
    const userId = Number(req.params.id);
    
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Валидация
    if (email && !validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (role && !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
    }
    
    // Проверка уникальности email если меняется
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(email && { email }),
        ...(name && { name }),
        ...(role && { role })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
    
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user', details: err });
  }
});

// Удалить пользователя (только admin)
router.delete('/:id', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const userId = Number(req.params.id);
    
    // Запретить админу удалять самого себя
    if (userId === req.user!.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Удаляем пользователя (связанные записи удалятся через каскад если настроено или вручную)
    await prisma.user.delete({ where: { id: userId } });
    
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user', details: err });
  }
});

export default router;
