import { Router } from "express";
import prisma from "../prisma/client";
import { authMiddleware, AuthRequest } from "../middlewares/auth";
const router = Router();

// Получить все лайки для поста
router.get("/post/:postId", async (req, res) => {
  try {
    const likes = await prisma.like.findMany({
      where: { postId: Number(req.params.postId) },
      include: { 
        user: { select: { id: true, name: true } }
      }
    });
    res.json(likes);
  } catch (err) {
    console.error('Fetch likes error:', err);
    res.status(500).json({ error: 'Failed to fetch likes', details: err });
  }
});

// Toggle лайк поста (добавить или удалить) - авторизован
router.post("/toggle", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { postId } = req.body;
    
    if (!postId) {
      return res.status(400).json({ error: 'Post ID is required' });
    }
    
    const postIdNum = Number(postId);
    
    // Проверяем существование поста
    const post = await prisma.post.findUnique({ where: { id: postIdNum } });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Проверяем существующий лайк
    const existingLike = await prisma.like.findFirst({
      where: {
        postId: postIdNum,
        userId: req.user!.id
      }
    });
    
    if (existingLike) {
      // Убираем лайк
      await prisma.like.delete({ where: { id: existingLike.id } });
      
      // Получаем обновленное количество лайков
      const likeCount = await prisma.like.count({
        where: { postId: postIdNum }
      });
      
      return res.json({ message: 'Like removed', liked: false, likeCount });
    } else {
      // Добавляем лайк
      const like = await prisma.like.create({
        data: {
          postId: postIdNum,
          userId: req.user!.id
        },
        include: {
          user: { select: { id: true, name: true } }
        }
      });
      
      // Получаем обновленное количество лайков
      const likeCount = await prisma.like.count({
        where: { postId: postIdNum }
      });
      
      return res.status(201).json({ message: 'Like added', liked: true, likeCount, like });
    }
  } catch (err) {
    console.error('Toggle like error:', err);
    res.status(400).json({ error: "Failed to toggle like", details: err });
  }
});

// Поставить лайк посту (авторизован) - альтернативный endpoint
router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { postId } = req.body;
    
    if (!postId) {
      return res.status(400).json({ error: 'Post ID is required' });
    }
    
    const postIdNum = Number(postId);
    
    // Проверяем существование поста
    const post = await prisma.post.findUnique({ where: { id: postIdNum } });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const like = await prisma.like.create({
      data: {
        postId: postIdNum,
        userId: req.user!.id
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    });
    
    res.status(201).json(like);
  } catch (err) {
    console.error('Create like error:', err);
    // Обрабатываем ошибку уникальности (если лайк уже существует)
    res.status(400).json({ error: "Failed to like post. Maybe already liked?", details: err });
  }
});

// Убрать лайк (авторизован)
router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const likeId = Number(req.params.id);
    const like = await prisma.like.findUnique({ where: { id: likeId } });
    
    if (!like) {
      return res.status(404).json({ error: "Like not found" });
    }
    
    if (like.userId !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.like.delete({ where: { id: likeId } });
    res.json({ message: "Like removed successfully" });
  } catch (err) {
    console.error('Delete like error:', err);
    res.status(400).json({ error: "Failed to remove like", details: err });
  }
});

export default router;
