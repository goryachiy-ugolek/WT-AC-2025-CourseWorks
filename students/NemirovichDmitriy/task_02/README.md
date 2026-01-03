# Поехали! — Вариант 35 (маршруты, места, даты, бюджет, заметки, шаринг)

Full-stack MVP: React + Node/Express + PostgreSQL/Prisma. Вариант 35 «Поездки “Поехали!”».

## Требования

- Node.js 18+
- PostgreSQL (доступен локально)

## Структура монорепозитория

- [apps/backend](apps/backend) — API (Express + Prisma + JWT)
- [apps/frontend](apps/frontend) — SPA (React + Vite)
- package.json (workspaces)

## Запуск всего проекта одной командой

1) Установить зависимости (из корня):

```
npm install
```

1) Подготовить окружение:

- Скопируйте env-файлы: `apps/backend/.env.example` → `.env`, `apps/frontend/.env.example` → `.env`
- Заполните в backend: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN` (домен фронтенда)

1) Применить миграции и seed (из корня):

```
npm run prisma:migrate:dev -- --name init
npm run prisma:seed -w backend
```

1) Запустить backend + frontend одновременно (из корня):

```
npm run dev
```

Frontend: <http://localhost:5173>, Backend: <http://localhost:4000> (по умолчанию).

## Как проверить работоспособность

1) Регистрация в UI или POST /auth/register (создаст refresh cookie + access token)
2) Вход: /auth/login (access в ответе, refresh в HttpOnly cookie)
3) Авто-refresh: дождаться истечения access (TTL по умолчанию 15m) либо временно уменьшить `JWT_ACCESS_TTL`, вызвать защищённый запрос — frontend сделает `POST /auth/refresh` с cookie и повторит запрос
4) Logout: /auth/logout — refresh отзыв, кука очищена, повторный /auth/refresh вернёт 401
5) Основной сценарий: создать поездку, добавить остановку, заметку, расход, расшарить по UUID пользователя, удалить участника (owner или сам участник)

## Детали

- Стек backend: Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT (access+refresh rotation), bcrypt, zod, helmet, cors, cookie-parser
- Стек frontend: React + TypeScript + Vite, react-router, react-hook-form + zod, axios
- CORS: на backend включён credentials, origin задаётся через env; frontend axios настроен с `withCredentials: true`
- Роли: `user`, `admin`; права см. README в модулях

## Дополнительно

- Подробности API и seed: [apps/backend/README.md](apps/backend/README.md)
- Подробности UI и сценариев: [apps/frontend/README.md](apps/frontend/README.md)
- Исходные требования и R1-документы: папка task_01/
