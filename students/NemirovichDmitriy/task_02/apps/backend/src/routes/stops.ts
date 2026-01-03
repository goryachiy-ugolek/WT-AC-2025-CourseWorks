import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { ensureTripMembership } from "../utils/access.js";
import { HttpError } from "../utils/httpError.js";

const router = Router();
router.use(requireAuth);

const stopSchema = z.object({
  tripId: z.string().uuid(),
  name: z.string().min(1),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  arrivalDate: z.string().datetime().optional(),
  departureDate: z.string().datetime().optional(),
  order: z.number().int().nonnegative()
});

const stopUpdateSchema = stopSchema.omit({ tripId: true }).partial();

router.post("/", async (req, res, next) => {
  try {
    const dto = stopSchema.parse(req.body);
    await ensureTripMembership(dto.tripId, req.user!.id, req.user!.role);

    const stop = await prisma.stop.create({
      data: {
        tripId: dto.tripId,
        name: dto.name,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        arrivalDate: dto.arrivalDate ? new Date(dto.arrivalDate) : undefined,
        departureDate: dto.departureDate ? new Date(dto.departureDate) : undefined,
        order: dto.order
      }
    });

    return res.status(201).json({ status: "ok", data: { stop } });
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const tripId = z.string().uuid().parse(req.query.tripId);
    await ensureTripMembership(tripId, req.user!.id, req.user!.role);

    const stops = await prisma.stop.findMany({ where: { tripId }, orderBy: { order: "asc" } });
    return res.json({ status: "ok", data: { items: stops } });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const stop = await prisma.stop.findUnique({ where: { id } });
    if (!stop) throw new HttpError(404, "Остановка не найдена");
    await ensureTripMembership(stop.tripId, req.user!.id, req.user!.role);
    return res.json({ status: "ok", data: { stop } });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const stop = await prisma.stop.findUnique({ where: { id } });
    if (!stop) throw new HttpError(404, "Остановка не найдена");
    await ensureTripMembership(stop.tripId, req.user!.id, req.user!.role);

    const dto = stopUpdateSchema.parse(req.body);

    const updated = await prisma.stop.update({
      where: { id },
      data: {
        name: dto.name,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        arrivalDate: dto.arrivalDate ? new Date(dto.arrivalDate) : undefined,
        departureDate: dto.departureDate ? new Date(dto.departureDate) : undefined,
        order: dto.order
      }
    });

    return res.json({ status: "ok", data: { stop: updated } });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const stop = await prisma.stop.findUnique({ where: { id } });
    if (!stop) throw new HttpError(404, "Остановка не найдена");
    await ensureTripMembership(stop.tripId, req.user!.id, req.user!.role);

    await prisma.stop.delete({ where: { id } });
    return res.json({ status: "ok" });
  } catch (error) {
    return next(error);
  }
});

export const stopsRouter = router;