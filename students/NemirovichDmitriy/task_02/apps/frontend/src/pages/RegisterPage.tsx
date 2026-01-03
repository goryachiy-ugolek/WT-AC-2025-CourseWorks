import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context";
import { extractErrorMessage } from "../utils";

const registerSchema = z.object({
  email: z.string().email("Введите корректный email"),
  username: z.string().min(3, "Имя минимум 3 символа").max(50, "Имя максимум 50 символов"),
  password: z
    .string()
    .min(8, "Пароль минимум 8 символов")
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "Пароль должен содержать буквы и цифры"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError(null);
      await registerUser(data.email, data.username, data.password);
      navigate("/trips", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, "Не удалось зарегистрироваться"));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1 className="auth-title">Регистрация</h1>
        <p className="auth-subtitle">Создайте аккаунт Поехали!</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email && <div className="form-error">{errors.email.message}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Имя пользователя
            </label>
            <input
              id="username"
              type="text"
              className="form-input"
              placeholder="ivan"
              {...register("username")}
            />
            {errors.username && <div className="form-error">{errors.username.message}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && <div className="form-error">{errors.password.message}</div>}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={isSubmitting}>
            {isSubmitting ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: "0.875rem" }}>
          Уже есть аккаунт? <Link to="/login">Войдите</Link>
        </p>
      </div>
    </div>
  );
};
