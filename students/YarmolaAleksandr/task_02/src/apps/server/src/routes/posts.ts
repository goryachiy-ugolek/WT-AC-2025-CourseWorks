import { Router } from "express";
import prisma from "../prisma/client";
import { authMiddleware, adminOnly, AuthRequest } from "../middlewares/auth";
import { validateTitle, validateContent, validatePagination } from "../utils/validation";
import { cacheGet, cacheSet, cacheDel, cacheDelPattern } from "../utils/redis";
import { incrementCacheHits, incrementCacheMisses } from "../utils/metrics";
import logger from "../utils/logger";

const router = Router();

// Получить все опубликованные посты с пагинацией и фильтрацией
router.get("/", async (req, res) => {
  try {
    const { page, limit, skip } = validatePagination(req.query.page as string, req.query.limit as string);
    const { tag, search, authorId } = req.query;
    
    // Создаем ключ кэша на основе параметров запроса
    const cacheKey = `posts:list:${page}:${limit}:${tag || ''}:${search || ''}:${authorId || ''}`;
    
    // Проверяем кэш
    const cached = await cacheGet(cacheKey);
    if (cached) {
      incrementCacheHits('posts');
      logger.debug('Cache hit', { key: cacheKey });
      return res.json(cached);
    }
    
    incrementCacheMisses('posts');
    logger.debug('Cache miss', { key: cacheKey });
    
    const where: any = { published: true };
    
    // Фильтр по тегу
    if (tag && typeof tag === 'string' && tag.trim() !== '') {
      where.tags = {
        some: {
          tag: {
            name: tag as string
          }
        }
      };
    }
    
    // Поиск по заголовку и содержимому
    if (search && typeof search === 'string' && search.trim() !== '') {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    // Фильтр по автору
    if (authorId) {
      where.authorId = Number(authorId);
    }
    
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, email: true } },
          tags: { include: { tag: true } },
          _count: { select: { comments: true, likes: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.post.count({ where })
    ]);
    
    const result = {
      posts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
    
    // Сохраняем в кэш на 5 минут
    await cacheSet(cacheKey, result, 300);
    
    res.json(result);
  } catch (err: any) {
    logger.error('Fetch posts error', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Failed to fetch posts', details: err });
  }
});

// Получить все черновики (только свои или все для admin)
router.get("/drafts", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = validatePagination(req.query.page as string, req.query.limit as string);
    const isAdmin = req.user!.role === 'admin';
    
    const where: any = { published: false };
    if (!isAdmin) {
      where.authorId = req.user!.id;
    }
    
    const [drafts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, email: true } },
          tags: { include: { tag: true } },
          _count: { select: { comments: true, likes: true } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.post.count({ where })
    ]);
    
    res.json({
      drafts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Fetch drafts error:', err);
    res.status(500).json({ error: 'Failed to fetch drafts', details: err });
  }
});

// Получить пост по id
router.get("/:id", async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const cacheKey = `posts:${postId}`;
    
    // Проверяем кэш
    const cached = await cacheGet(cacheKey);
    if (cached) {
      incrementCacheHits('post');
      return res.json(cached);
    }
    
    incrementCacheMisses('post');
    
    const post = await prisma.post.findUnique({ 
      where: { id: postId }, 
      include: { 
        author: { select: { id: true, name: true, email: true } },
        tags: { include: { tag: true } },
        comments: { 
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' }
        },
        _count: { select: { likes: true } }
      } 
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Сохраняем в кэш на 10 минут
    await cacheSet(cacheKey, post, 600);
    
    res.json(post);
  } catch (err: any) {
    logger.error('Fetch post error', { error: err.message, postId: req.params.id });
    res.status(500).json({ error: 'Failed to fetch post', details: err });
  }
});

// Создать новый пост
router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { title, content, published, tagIds } = req.body;
    
    // Валидация
    const titleValidation = validateTitle(title);
    if (!titleValidation.valid) {
      return res.status(400).json({ error: titleValidation.message });
    }
    
    const contentValidation = validateContent(content);
    if (!contentValidation.valid) {
      return res.status(400).json({ error: contentValidation.message });
    }
    
    const postData: any = {
      title,
      content,
      published: published || false,
      authorId: req.user!.id
    };
    
    // Добавление тегов если переданы
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      postData.tags = {
        create: tagIds.map((tagId: number) => ({
          tag: { connect: { id: tagId } }
        }))
      };
    }
    
    const post = await prisma.post.create({
      data: postData,
      include: {
        author: { select: { id: true, name: true, email: true } },
        tags: { include: { tag: true } },
        _count: { select: { comments: true, likes: true } }
      }
    });
    
    // Инвалидация кэша
    await cacheDelPattern('posts:list:*');
    await cacheDel(`posts:${post.id}`);
    logger.info('Post created', { postId: post.id, authorId: req.user!.id });
    
    res.status(201).json(post);
  } catch (err: any) {
    logger.error('Create post error', { error: err.message, stack: err.stack });
    res.status(400).json({ error: 'Failed to create post', details: err });
  }
});

// Обновить пост (только владелец и админ)
router.put("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const postId = Number(req.params.id);
    const post = await prisma.post.findUnique({ where: { id: postId } });
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    if (post.authorId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { title, content, published, tagIds } = req.body;
    
    // Валидация
    if (title) {
      const titleValidation = validateTitle(title);
      if (!titleValidation.valid) {
        return res.status(400).json({ error: titleValidation.message });
      }
    }
    
    if (content) {
      const contentValidation = validateContent(content);
      if (!contentValidation.valid) {
        return res.status(400).json({ error: contentValidation.message });
      }
    }
    
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (published !== undefined) updateData.published = published;
    
    // Обновление тегов если переданы
    if (tagIds !== undefined && Array.isArray(tagIds)) {
      // Удаляем старые связи и создаем новые
      await prisma.postTag.deleteMany({ where: { postId } });
      if (tagIds.length > 0) {
        updateData.tags = {
          create: tagIds.map((tagId: number) => ({
            tag: { connect: { id: tagId } }
          }))
        };
      }
    }
    
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: updateData,
      include: {
        author: { select: { id: true, name: true, email: true } },
        tags: { include: { tag: true } },
        _count: { select: { comments: true, likes: true } }
      }
    });
    
    res.json(updatedPost);
  } catch (err) {
    console.error('Update post error:', err);
    res.status(400).json({ error: "Failed to update post", details: err });
  }
});

// Удалить пост (только владелец и админ)
router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const postId = Number(req.params.id);
    const post = await prisma.post.findUnique({ where: { id: postId } });
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    if (post.authorId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.post.delete({ where: { id: postId } });
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(400).json({ error: "Failed to delete post", details: err });
  }
});

export default router;
