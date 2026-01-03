import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { ensureTripAccess, ensureTripMembership, isAdmin } from "../utils/access.js";
import { HttpError } from "../utils/httpError.js";

const router = Router();
router.use(requireAuth);

const noteCreateSchema = z.object({
  tripId: z.string().uuid(),
  content: z.string().min(1)
});

const noteListSchema = z.object({
  tripId: z.string().uuid(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0)
});

router.post("/", async (req, res, next) => {
  try {
    const dto = noteCreateSchema.parse(req.body);
    await ensureTripMembership(dto.tripId, req.user!.id, req.user!.role);

    const note = await prisma.note.create({
      data: {
        tripId: dto.tripId,
        authorId: req.user!.id,
        content: dto.content
      }
    });

    return res.status(201).json({ status: "ok", data: { note } });
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { tripId, limit, offset } = noteListSchema.parse(req.query);
    await ensureTripMembership(tripId, req.user!.id, req.user!.role);

    const notes = await prisma.note.findMany({
      where: { tripId },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit
    });

    return res.json({ status: "ok", data: { items: notes, pagination: { limit, offset } } });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) throw new HttpError(404, "Заметка не найдена");
    await ensureTripMembership(note.tripId, req.user!.id, req.user!.role);
    return res.json({ status: "ok", data: { note } });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) throw new HttpError(404, "Заметка не найдена");
    if (note.authorId !== req.user!.id) throw new HttpError(403, "Редактировать может только автор");

    const dto = noteCreateSchema.pick({ content: true }).parse(req.body);
    const updated = await prisma.note.update({ where: { id }, data: { content: dto.content } });
    return res.json({ status: "ok", data: { note: updated } });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) throw new HttpError(404, "Заметка не найдена");

    const trip = await ensureTripAccess(note.tripId, req.user!.id, req.user!.role);
    const canDelete =
      note.authorId === req.user!.id || trip.ownerId === req.user!.id || isAdmin(req.user!.role);

    if (!canDelete) throw new HttpError(403, "Недостаточно прав для удаления заметки");

    await prisma.note.delete({ where: { id } });
    return res.json({ status: "ok" });
  } catch (error) {
    return next(error);
  }
});

export const notesRouter = router;