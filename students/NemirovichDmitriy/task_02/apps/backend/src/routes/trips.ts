import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpError } from "../utils/httpError.js";
import {
  ensureTripAccess,
  ensureTripOwner,
  ensureTripOwnerOrSelf,
  ensureUserExists,
  isAdmin
} from "../utils/access.js";

const router = Router();

const tripPayloadSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    budget: z.number().nonnegative().optional()
  })
  .refine((data) => new Date(data.endDate).getTime() >= new Date(data.startDate).getTime(), {
    message: "Дата окончания должна быть после даты начала",
    path: ["endDate"]
  });

const listQuerySchema = z.object({
  ownerId: z.string().uuid().optional(),
  participantId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0)
});

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const { ownerId, participantId, limit, offset } = listQuerySchema.parse(req.query);
    const user = req.user!;

    const membershipFilter = {
      OR: [{ ownerId: user.id }, { participants: { some: { userId: user.id } } }]
    };

    const filters: any[] = [];
    if (!isAdmin(user.role)) filters.push(membershipFilter);
    if (ownerId) filters.push({ ownerId });
    if (participantId) filters.push({ participants: { some: { userId: participantId } } });

    const where = filters.length ? { AND: filters } : {};

    const trips = await prisma.trip.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit
    });

    return res.json({ status: "ok", data: { items: trips, pagination: { limit, offset } } });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const tripId = z.string().uuid().parse(req.params.id);
    await ensureTripAccess(tripId, req.user!.id, req.user!.role);

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        stops: { orderBy: { order: "asc" } },
        participants: true
      }
    });

    if (!trip) throw new HttpError(404, "Поездка не найдена");
    return res.json({ status: "ok", data: { trip } });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const dto = tripPayloadSchema.parse(req.body);
    const user = req.user!;

    const trip = await prisma.trip.create({
      data: {
        title: dto.title,
        description: dto.description,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        budget: dto.budget,
        ownerId: user.id,
        participants: {
          create: { userId: user.id }
        }
      }
    });

    return res.status(201).json({ status: "ok", data: { trip } });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const tripId = z.string().uuid().parse(req.params.id);
    await ensureTripOwner(tripId, req.user!.id, req.user!.role);
    const dto = tripPayloadSchema.partial().refine((data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate).getTime() >= new Date(data.startDate).getTime();
      }
      return true;
    }, {
      message: "Дата окончания должна быть после даты начала",
      path: ["endDate"]
    }).parse(req.body);

    const trip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        title: dto.title,
        description: dto.description,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        budget: dto.budget
      }
    });

    return res.json({ status: "ok", data: { trip } });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const tripId = z.string().uuid().parse(req.params.id);
    await ensureTripOwner(tripId, req.user!.id, req.user!.role);
    await prisma.trip.delete({ where: { id: tripId } });
    return res.json({ status: "ok" });
  } catch (error) {
    return next(error);
  }
});

const shareSchema = z.object({ userId: z.string().uuid() });

router.post("/:id/share", async (req, res, next) => {
  try {
    const tripId = z.string().uuid().parse(req.params.id);
    const { userId } = shareSchema.parse(req.body);
    const requester = req.user!;

    await ensureTripOwner(tripId, requester.id, requester.role);
    await ensureUserExists(userId);

    const existing = await prisma.tripParticipant.findFirst({ where: { tripId, userId } });
    if (existing) throw new HttpError(409, "Пользователь уже участник поездки");

    await prisma.tripParticipant.create({ data: { tripId, userId } });
    return res.status(201).json({ status: "ok" });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id/participants/:userId", async (req, res, next) => {
  try {
    const tripId = z.string().uuid().parse(req.params.id);
    const targetUserId = z.string().uuid().parse(req.params.userId);
    const requester = req.user!;

    await ensureTripOwnerOrSelf(tripId, targetUserId, requester.id, requester.role);

    const deleted = await prisma.tripParticipant.deleteMany({ where: { tripId, userId: targetUserId } });
    if (deleted.count === 0) throw new HttpError(404, "Участник не найден в поездке");

    return res.json({ status: "ok" });
  } catch (error) {
    return next(error);
  }
});

export const tripsRouter = router;