import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpError.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: "error",
      error: {
        code: "validation_failed",
        message: "Ошибка валидации",
        fields: err.flatten().fieldErrors
      }
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      status: "error",
      error: { code: "http_error", message: err.message }
    });
  }

  console.error(err);
  return res.status(500).json({
    status: "error",
    error: { code: "server_error", message: "Внутренняя ошибка сервера" }
  });
};
