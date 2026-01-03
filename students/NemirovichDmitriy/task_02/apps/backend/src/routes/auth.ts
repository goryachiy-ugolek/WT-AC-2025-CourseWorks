import { Router, type Request, type Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  createAccessToken,
  createRefreshToken,
  hashTokenId,
  refreshCookieMaxAgeMs,
  refreshExpiryDate,
  verifyRefreshToken
} from "../lib/tokens.js";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { isProd } from "../config/env.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "Пароль должен содержать буквы и цифры")
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const buildCookieOptions = () => ({
  httpOnly: true,
  sameSite: (isProd ? "strict" : "lax") as "lax" | "strict",
  secure: isProd,
  path: "/",
  maxAge: refreshCookieMaxAgeMs()
});

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie("refreshToken", token, buildCookieOptions());
};

const clearRefreshCookie = (res: Response) => {
  res.clearCookie("refreshToken", { ...buildCookieOptions(), maxAge: 0 });
};

const userSelect = {
  id: true,
  email: true,
  username: true,
  role: true,
  createdAt: true,
  updatedAt: true
};

const createSession = async (userId: string, role: string, req: Request) => {
  const jti = crypto.randomUUID();
  const jtiHash = hashTokenId(jti);
  const refreshToken = createRefreshToken(userId, role, jti);
  await prisma.refreshToken.create({
    data: {
      userId,
      jtiHash,
      expiresAt: refreshExpiryDate(),
      createdByIp: req.ip,
      userAgent: req.get("user-agent") || undefined
    }
  });
  const accessToken = createAccessToken(userId, role);
  return { accessToken, refreshToken, jtiHash };
};

const revokeAllUserTokens = async (userId: string) => {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
};

const revokeTokenByHash = async (jtiHash: string, replacedBy?: string) => {
  await prisma.refreshToken.updateMany({
    where: { jtiHash },
    data: { revokedAt: new Date(), replacedByTokenId: replacedBy }
  });
};

router.post("/register", async (req, res, next) => {
  try {
    const dto = registerSchema.parse(req.body);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] }
    });
    if (existing) {
      throw new HttpError(409, "Пользователь с таким email или username уже существует");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        role: "user"
      },
      select: userSelect
    });

    const session = await createSession(user.id, user.role, req);
    setRefreshCookie(res, session.refreshToken);

    return res.status(201).json({
      status: "ok",
      data: { accessToken: session.accessToken, user }
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const dto = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new HttpError(401, "Неверный email или пароль");
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new HttpError(401, "Неверный email или пароль");
    }

    const session = await createSession(user.id, user.role, req);
    setRefreshCookie(res, session.refreshToken);

    return res.json({
      status: "ok",
      data: {
        accessToken: session.accessToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const cookieToken = req.cookies?.refreshToken as string | undefined;
    if (!cookieToken) {
      throw new HttpError(401, "Refresh token отсутствует");
    }

    let payload;
    try {
      payload = verifyRefreshToken(cookieToken);
    } catch (error) {
      clearRefreshCookie(res);
      throw new HttpError(401, "Неверный или просроченный refresh token");
    }

    const jtiHash = hashTokenId(payload.jti);
    const tokenRecord = await prisma.refreshToken.findUnique({ where: { jtiHash } });

    if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.replacedByTokenId) {
      await revokeAllUserTokens(payload.sub);
      clearRefreshCookie(res);
      throw new HttpError(401, "Refresh token отозван или скомпрометирован");
    }

    if (tokenRecord.expiresAt < new Date()) {
      await revokeTokenByHash(jtiHash);
      clearRefreshCookie(res);
      throw new HttpError(401, "Refresh token просрочен");
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: userSelect });
    if (!user) {
      await revokeTokenByHash(jtiHash);
      clearRefreshCookie(res);
      throw new HttpError(401, "Пользователь не найден");
    }

    const newSession = await createSession(user.id, user.role, req);
    await revokeTokenByHash(jtiHash, newSession.jtiHash);

    setRefreshCookie(res, newSession.refreshToken);

    return res.json({
      status: "ok",
      data: { accessToken: newSession.accessToken }
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const cookieToken = req.cookies?.refreshToken as string | undefined;
    if (cookieToken) {
      try {
        const payload = verifyRefreshToken(cookieToken);
        const jtiHash = hashTokenId(payload.jti);
        await revokeTokenByHash(jtiHash);
      } catch (error) {
        // ignore
      }
    }
    clearRefreshCookie(res);
    return res.json({ status: "ok" });
  } catch (error) {
    return next(error);
  }
});

export const authRouter = router;
