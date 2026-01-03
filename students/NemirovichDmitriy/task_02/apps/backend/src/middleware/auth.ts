import type { RequestHandler } from "express";
import { verifyAccessToken } from "../lib/tokens.js";
import { HttpError } from "../utils/httpError.js";

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new HttpError(401, "Требуется аутентификация"));
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (error) {
    return next(new HttpError(401, "Неверный или просроченный access token"));
  }
};
