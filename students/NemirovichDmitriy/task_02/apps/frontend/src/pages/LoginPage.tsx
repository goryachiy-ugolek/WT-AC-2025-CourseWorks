import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context";
import { extractErrorMessage } from "../utils";

const loginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(8, "Пароль минимум 8 символов"),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/trips";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null);
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, "Не удалось войти"));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1 className="auth-title">Вход</h1>
        <p className="auth-subtitle">Войдите в аккаунт Поехали!</p>

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
            {isSubmitting ? "Вход..." : "Войти"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: "0.875rem" }}>
          Нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>
        </p>
      </div>
    </div>
  );
};
