import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env, isProd } from "./config/env.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { tripsRouter } from "./routes/trips.js";
import { stopsRouter } from "./routes/stops.js";
import { notesRouter } from "./routes/notes.js";
import { expensesRouter } from "./routes/expenses.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRouter);
  app.use("/users", usersRouter);
  app.use("/trips", tripsRouter);
  app.use("/stops", stopsRouter);
  app.use("/notes", notesRouter);
  app.use("/expenses", expensesRouter);

  app.use((req, res) => {
    res.status(404).json({ status: "error", error: { code: "not_found", message: "Маршрут не найден" } });
  });

  app.use(errorHandler);

  // In dev allow unhandled promise logs to be visible
  if (!isProd) {
    process.on("unhandledRejection", (reason) => {
      console.error("Unhandled Rejection:", reason);
    });
  }

  return app;
};
