import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { ensureTripAccess, ensureTripMembership, isAdmin } from "../utils/access.js";
import { HttpError } from "../utils/httpError.js";

const router = Router();
router.use(requireAuth);

const expenseSchema = z.object({
  tripId: z.string().uuid(),
  amount: z.number().positive(),
  category: z.string().optional(),
  description: z.string().optional(),
  date: z.string().datetime()
});

const expenseUpdateSchema = expenseSchema.omit({ tripId: true }).partial();

const expenseListSchema = z.object({
  tripId: z.string().uuid(),
  category: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0)
});

router.post("/", async (req, res, next) => {
  try {
    const dto = expenseSchema.parse(req.body);
    await ensureTripMembership(dto.tripId, req.user!.id, req.user!.role);

    const expense = await prisma.expense.create({
      data: {
        tripId: dto.tripId,
        authorId: req.user!.id,
        amount: dto.amount,
        category: dto.category,
        description: dto.description,
        date: new Date(dto.date)
      }
    });

    return res.status(201).json({ status: "ok", data: { expense } });
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { tripId, category, limit, offset } = expenseListSchema.parse(req.query);
    await ensureTripMembership(tripId, req.user!.id, req.user!.role);

    const expenses = await prisma.expense.findMany({
      where: { tripId, category: category ? category : undefined },
      orderBy: { date: "desc" },
      skip: offset,
      take: limit
    });

    return res.json({ status: "ok", data: { items: expenses, pagination: { limit, offset } } });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new HttpError(404, "Расход не найден");
    await ensureTripMembership(expense.tripId, req.user!.id, req.user!.role);
    return res.json({ status: "ok", data: { expense } });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new HttpError(404, "Расход не найден");
    if (expense.authorId !== req.user!.id) throw new HttpError(403, "Редактировать может только автор");

    const dto = expenseUpdateSchema.parse(req.body);

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        amount: dto.amount,
        category: dto.category,
        description: dto.description,
        date: dto.date ? new Date(dto.date) : undefined
      }
    });

    return res.json({ status: "ok", data: { expense: updated } });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new HttpError(404, "Расход не найден");

    const trip = await ensureTripAccess(expense.tripId, req.user!.id, req.user!.role);
    const canDelete =
      expense.authorId === req.user!.id || trip.ownerId === req.user!.id || isAdmin(req.user!.role);
    if (!canDelete) throw new HttpError(403, "Недостаточно прав для удаления расхода");

    await prisma.expense.delete({ where: { id } });
    return res.json({ status: "ok" });
  } catch (error) {
    return next(error);
  }
});

export const expensesRouter = router;