import { AxiosError } from "axios";
import type { ApiResponse } from "../types";

export function extractErrorMessage(error: unknown, fallback = "Произошла ошибка"): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiResponse<unknown> | undefined;
    if (data?.error) {
      // Если есть детали валидации — показываем первую
      if (data.details && data.details.length > 0) {
        return data.details.map((d) => d.message).join("; ");
      }
      return data.error;
    }
    if (error.response?.status === 401) {
      return "Сессия истекла. Войдите снова.";
    }
    if (error.response?.status === 403) {
      return "Недостаточно прав для выполнения действия.";
    }
    if (error.response?.status === 404) {
      return "Ресурс не найден.";
    }
    if (error.response?.status === 409) {
      return "Конфликт данных.";
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
