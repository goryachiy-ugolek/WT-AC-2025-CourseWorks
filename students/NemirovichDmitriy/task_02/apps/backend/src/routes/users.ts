import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const userSelect = {
  id: true,
  email: true,
  username: true,
  role: true,
  createdAt: true,
  updatedAt: true
};

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: userSelect });
    if (!user) {
      return res.status(404).json({ status: "error", error: { code: "not_found", message: "Пользователь не найден" } });
    }
    return res.json({ status: "ok", data: { user } });
  } catch (error) {
    return next(error);
  }
});

export const usersRouter = router;
