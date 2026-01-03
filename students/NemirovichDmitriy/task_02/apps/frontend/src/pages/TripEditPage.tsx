import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { tripsApi } from "../api";
import type { Trip } from "../types";
import { LoadingSpinner, ErrorAlert } from "../components";
import { extractErrorMessage, toISODate, toInputDate } from "../utils";

const tripSchema = z
  .object({
    title: z.string().min(1, "Название обязательно"),
    description: z.string().optional(),
    startDate: z.string().min(1, "Дата начала обязательна"),
    endDate: z.string().min(1, "Дата окончания обязательна"),
    budget: z.coerce.number().nonnegative("Бюджет не может быть отрицательным").optional().or(z.literal("")),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "Дата окончания должна быть после даты начала",
    path: ["endDate"],
  });

type TripForm = z.infer<typeof tripSchema>;

export const TripEditPage = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TripForm>({
    resolver: zodResolver(tripSchema),
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await tripsApi.get(tripId!);
        setTrip(data);
        reset({
          title: data.title,
          description: data.description || "",
          startDate: toInputDate(data.startDate),
          endDate: toInputDate(data.endDate),
          budget: data.budget ?? "",
        });
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tripId, reset]);

  const onSubmit = async (data: TripForm) => {
    try {
      setError(null);
      await tripsApi.update(tripId!, {
        title: data.title,
        description: data.description || undefined,
        startDate: toISODate(data.startDate),
        endDate: toISODate(data.endDate),
        budget: data.budget ? Number(data.budget) : undefined,
      });
      navigate(`/trips/${tripId}`);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  if (loading) {
    return <LoadingSpinner message="Загрузка..." />;
  }

  if (!trip) {
    return <ErrorAlert message={error || "Поездка не найдена"} />;
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Редактирование поездки</h1>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Название</label>
            <input className="form-input" {...register("title")} />
            {errors.title && <div className="form-error">{errors.title.message}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Описание</label>
            <textarea className="form-textarea" {...register("description")} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Дата начала</label>
              <input className="form-input" type="date" {...register("startDate")} />
              {errors.startDate && <div className="form-error">{errors.startDate.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Дата окончания</label>
              <input className="form-input" type="date" {...register("endDate")} />
              {errors.endDate && <div className="form-error">{errors.endDate.message}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Бюджет (₽)</label>
            <input className="form-input" type="number" {...register("budget")} />
            {errors.budget && <div className="form-error">{errors.budget.message}</div>}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Сохранение..." : "Сохранить"}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate(`/trips/${tripId}`)}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
