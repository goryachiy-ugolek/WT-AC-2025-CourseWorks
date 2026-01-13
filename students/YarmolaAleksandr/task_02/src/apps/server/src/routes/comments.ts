import { Router } from "express";
import prisma from "../prisma/client";
import { authMiddleware, AuthRequest } from "../middlewares/auth";
const router = Router();

// Получить все комментарии к посту (по id поста)
router.get("/post/:postId", async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { postId: Number(req.params.postId) },
      include: { 
        author: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "asc" }
    });
    res.json(comments);
  } catch (err) {
    console.error('Fetch comments error:', err);
    res.status(500).json({ error: 'Failed to fetch comments', details: err });
  }
});

// Получить комментарий по id
router.get("/:id", async (req, res) => {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: Number(req.params.id) },
      include: { 
        author: { select: { id: true, name: true } }
      }
    });
    
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    
    res.json(comment);
  } catch (err) {
    console.error('Fetch comment error:', err);
    res.status(500).json({ error: 'Failed to fetch comment', details: err });
  }
});

// Создать комментарий (авторизован)
router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { content, postId } = req.body;
    
    // Валидация
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    if (!postId) {
      return res.status(400).json({ error: 'Post ID is required' });
    }
    
    // Проверяем, что пост существует
    const post = await prisma.post.findUnique({ where: { id: Number(postId) } });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const comment = await prisma.comment.create({
      data: {
        content,
        postId: Number(postId),
        authorId: req.user!.id
      },
      include: {
        author: { select: { id: true, name: true } }
      }
    });
    
    res.status(201).json(comment);
  } catch (err) {
    console.error('Create comment error:', err);
    res.status(400).json({ error: "Failed to create comment", details: err });
  }
});

// Обновить комментарий (только владелец или admin)
router.put("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const commentId = Number(req.params.id);
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    
    if (comment.authorId !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: { select: { id: true, name: true } }
      }
    });
    
    res.json(updatedComment);
  } catch (err) {
    console.error('Update comment error:', err);
    res.status(400).json({ error: "Failed to update comment", details: err });
  }
});

// Удалить комментарий (только владелец или admin)
router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const commentId = Number(req.params.id);
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    
    if (comment.authorId !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.comment.delete({ where: { id: commentId } });
    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(400).json({ error: "Failed to delete comment", details: err });
  }
});

export default router;
