import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client';

export interface AuthRequest extends Request {
  user?: { id: number, role: string }
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authorized' });
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: number, role: string };
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
};

// Отдельная функция для проверки владельца
export const ownerOnly = (model: 'post' | 'comment') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    let entity;
    if (model === 'post') entity = await prisma.post.findUnique({ where: { id: Number(id) } });
    if (model === 'comment') entity = await prisma.comment.findUnique({ where: { id: Number(id) } });
    if (!entity) return res.status(404).json({ error: `${model} not found` });

    if (entity.authorId !== req.user!.id && req.user!.role !== 'admin')
      return res.status(403).json({ error: 'Forbidden' });

    next();
  };
};

