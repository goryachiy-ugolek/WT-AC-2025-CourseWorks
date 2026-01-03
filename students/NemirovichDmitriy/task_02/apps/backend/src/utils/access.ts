import { prisma } from "../lib/prisma.js";
import { HttpError } from "./httpError.js";

export const ensureTripExists = async (tripId: string) => {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new HttpError(404, "Поездка не найдена");
  return trip;
};

export const ensureUserExists = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, "Пользователь не найден");
  return user;
};

export const isAdmin = (role: string) => role === "admin";

export const ensureTripAccess = async (tripId: string, userId: string, role: string) => {
  const trip = await ensureTripExists(tripId);
  if (isAdmin(role)) return trip;
  if (trip.ownerId === userId) return trip;
  const participant = await prisma.tripParticipant.findFirst({ where: { tripId, userId } });
  if (!participant) throw new HttpError(403, "Доступ запрещен");
  return trip;
};

export const ensureTripOwner = async (tripId: string, userId: string, role: string) => {
  const trip = await ensureTripExists(tripId);
  if (isAdmin(role)) return trip;
  if (trip.ownerId !== userId) throw new HttpError(403, "Только владелец может выполнять это действие");
  return trip;
};

export const ensureTripOwnerOrSelf = async (
  tripId: string,
  targetUserId: string,
  requesterId: string,
  role: string
) => {
  const trip = await ensureTripExists(tripId);
  if (isAdmin(role)) return trip;
  if (trip.ownerId === requesterId) return trip;
  if (targetUserId === requesterId) return trip;
  throw new HttpError(403, "Недостаточно прав для удаления участника");
};

export const ensureTripMembership = async (tripId: string, userId: string, role: string) => {
  const trip = await ensureTripExists(tripId);
  if (isAdmin(role) || trip.ownerId === userId) return trip;
  const participant = await prisma.tripParticipant.findFirst({ where: { tripId, userId } });
  if (!participant) throw new HttpError(403, "Доступ запрещен");
  return trip;
};