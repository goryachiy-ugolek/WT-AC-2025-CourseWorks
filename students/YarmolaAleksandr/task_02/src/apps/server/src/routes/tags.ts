import { Router } from "express";
import prisma from "../prisma/client";
import { authMiddleware, adminOnly } from "../middlewares/auth";
import { validateTagName } from "../utils/validation";
const router = Router();

// Получить все теги
router.get("/", async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({ 
      include: { 
        _count: { select: { posts: true } }
      },
      orderBy: { name: 'asc' }
    });
    
    res.json(tags);
  } catch (err) {
    console.error('Fetch tags error:', err);
    res.status(500).json({ error: 'Failed to fetch tags', details: err });
  }
});

// Получить тег по id
router.get("/:id", async (req, res) => {
  try {
    const tag = await prisma.tag.findUnique({ 
      where: { id: Number(req.params.id) }, 
      include: { 
        posts: {
          include: {
            post: {
              select: {
                id: true,
                title: true,
                published: true,
                createdAt: true,
                author: { select: { id: true, name: true } }
              }
            }
          }
        }
      } 
    });
    
    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }
    
    res.json(tag);
  } catch (err) {
    console.error('Fetch tag error:', err);
    res.status(500).json({ error: 'Failed to fetch tag', details: err });
  }
});

// Создать тег (только admin)
router.post("/", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name } = req.body;
    
    const nameValidation = validateTagName(name);
    if (!nameValidation.valid) {
      return res.status(400).json({ error: nameValidation.message });
    }
    
    // Проверка уникальности
    const existingTag = await prisma.tag.findUnique({ where: { name } });
    if (existingTag) {
      return res.status(400).json({ error: 'Tag with this name already exists' });
    }
    
    const tag = await prisma.tag.create({ data: { name } });
    res.status(201).json(tag);
  } catch (err) {
    console.error('Create tag error:', err);
    res.status(400).json({ error: "Failed to create tag", details: err });
  }
});

// Обновить тег (только admin)
router.put("/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name } = req.body;
    const tagId = Number(req.params.id);
    
    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }
    
    const nameValidation = validateTagName(name);
    if (!nameValidation.valid) {
      return res.status(400).json({ error: nameValidation.message });
    }
    
    // Проверка уникальности если имя изменилось
    if (name !== tag.name) {
      const existingTag = await prisma.tag.findUnique({ where: { name } });
      if (existingTag) {
        return res.status(400).json({ error: 'Tag with this name already exists' });
      }
    }
    
    const updatedTag = await prisma.tag.update({
      where: { id: tagId },
      data: { name },
    });
    
    res.json(updatedTag);
  } catch (err) {
    console.error('Update tag error:', err);
    res.status(400).json({ error: "Failed to update tag", details: err });
  }
});

// Удалить тег (только admin)
router.delete("/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const tagId = Number(req.params.id);
    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    
    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }
    
    await prisma.tag.delete({ where: { id: tagId } });
    res.json({ message: "Tag deleted successfully" });
  } catch (err) {
    console.error('Delete tag error:', err);
    res.status(400).json({ error: "Failed to delete tag", details: err });
  }
});

export default router;
