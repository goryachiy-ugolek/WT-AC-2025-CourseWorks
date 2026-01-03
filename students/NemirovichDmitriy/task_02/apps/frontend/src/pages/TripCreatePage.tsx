import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { tripsApi } from "../api";
import { extractErrorMessage, toISODate } from "../utils";

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

export const TripCreatePage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TripForm>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      budget: "",
    },
  });

  const onSubmit = async (data: TripForm) => {
    try {
      setError(null);
      const trip = await tripsApi.create({
        title: data.title,
        description: data.description || undefined,
        startDate: toISODate(data.startDate),
        endDate: toISODate(data.endDate),
        budget: data.budget ? Number(data.budget) : undefined,
      });
      navigate(`/trips/${trip.id}`);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Новая поездка</h1>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Название</label>
            <input className="form-input" {...register("title")} placeholder="Поездка в Стамбул" />
            {errors.title && <div className="form-error">{errors.title.message}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Описание</label>
            <textarea className="form-textarea" {...register("description")} placeholder="Описание поездки..." />
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
            <input className="form-input" type="number" {...register("budget")} placeholder="100000" />
            {errors.budget && <div className="form-error">{errors.budget.message}</div>}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Создание..." : "Создать"}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate("/trips")}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
