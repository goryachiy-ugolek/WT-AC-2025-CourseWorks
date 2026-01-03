import jwt, { type JwtPayload } from "jsonwebtoken";
import ms from "ms";
import crypto from "crypto";
import { env } from "../config/env.js";

export type AccessPayload = JwtPayload & { sub: string; role: string };
export type RefreshPayload = JwtPayload & { sub: string; role: string; jti: string };

export const createAccessToken = (userId: string, role: string) =>
  jwt.sign({ sub: userId, role }, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL });

export const createRefreshToken = (userId: string, role: string, jti: string) =>
  jwt.sign({ sub: userId, role, jti }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_TTL });

export const verifyAccessToken = (token: string): AccessPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
};

export const verifyRefreshToken = (token: string): RefreshPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload;
};

export const refreshCookieMaxAgeMs = () => ms(env.JWT_REFRESH_TTL);
export const refreshExpiryDate = () => new Date(Date.now() + refreshCookieMaxAgeMs());

export const hashTokenId = (id: string) => {
  return crypto.createHash("sha256").update(id).digest("hex");
};
