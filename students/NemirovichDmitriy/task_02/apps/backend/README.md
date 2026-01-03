# Backend (Поехали!) — API (вариант 35)

## Запуск

1) Установить зависимости в корне монорепо

```
npm install
```

1) Настроить окружение

- Скопируйте `apps/backend/.env.example` → `apps/backend/.env`
- Заполните `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`

1) Prisma

```
npm run prisma:generate -w backend
npm run prisma:migrate:dev -w backend -- --name init
npm run prisma:studio -w backend   # опционально, для просмотра БД
npm run prisma:seed -w backend     # наполнить тестовыми данными
```

1) Старт сервера

```
npm run dev:backend
# GET http://localhost:4000/health -> {"status":"ok"}
```

> Также можно стартовать сразу вместе с frontend из корня: `npm run dev`

## Стек и функциональность

- Node.js + Express + TypeScript
- PostgreSQL + Prisma
- JWT (access + refresh, rotation) в HttpOnly cookie
- bcryptjs, zod, helmet, cors, cookie-parser
- Роли: user, admin. Доступ: owner/admin на изменения поездок; автор/owner/admin на удаление заметок/расходов; участник видит данные своей поездки.
- Модели: User, Trip, Stop, Note, Expense, TripParticipant, RefreshToken

## Переменные окружения

```
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/poehali?schema=public
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
CORS_ORIGIN=http://localhost:5173
```

## Эндпоинты (минимум)

- POST /auth/register — создаёт пользователя, ставит refresh cookie, возвращает access token + user
- POST /auth/login — проверяет пароль, ставит refresh cookie, возвращает access token + user
- POST /auth/refresh — читает refresh cookie, ротирует refresh, выдаёт новый access token
- POST /auth/logout — отзывает текущий refresh (если есть), чистит cookie
- GET /users/me — профиль (access token в Authorization: Bearer)
- GET /health — проверка живости

### Бизнес-ресурсы (access token обязателен)

- /trips — список (фильтры ownerId/participantId), создание, получение, обновление (owner/admin), удаление (owner/admin)
- /trips/:id/share — шаринг (owner), /trips/:id/participants/:userId — удалить участника (owner или self)
- /stops — CRUD (owner/participant); список по tripId
- /notes — CRUD: создать/читать (owner/participant), редактировать (author), удалить (author/owner/admin)
- /expenses — CRUD: создать/читать (owner/participant), редактировать (author), удалить (author/owner/admin)

## Seed данные (для разработки/демо)

- <admin@example.com> / Admin1234 (role: admin)
- <user1@example.com> / User1234 (role: user)
- <user2@example.com> / User2234 (role: user)
- Данные: поездки «Поездка в Стамбул» (owner: user1, participant: user2) со стопами/заметками/расходами; «Поездка в Сочи» (owner: user2)
- Команда: `npm run prisma:seed -w backend`

## Примеры запросов (PowerShell)

> Refresh хранится в HttpOnly cookie, поэтому используем `-WebSession`.

```powershell
$base = "http://localhost:4000"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# Register
Invoke-WebRequest -Uri "$base/auth/register" -Method Post -ContentType 'application/json' -Body '{"email":"demo@example.com","username":"demo","password":"Demo1234"}' -WebSession $session | Select-Object -ExpandProperty Content

# Login (refresh кука устанавливается, access в ответе)
$login = Invoke-WebRequest -Uri "$base/auth/login" -Method Post -ContentType 'application/json' -Body '{"email":"admin@example.com","password":"Admin1234"}' -WebSession $session
$access = ($login.Content | ConvertFrom-Json).data.accessToken

# Профиль текущего пользователя
Invoke-WebRequest -Uri "$base/users/me" -Headers @{ Authorization = "Bearer $access" } -WebSession $session | Select-Object -ExpandProperty Content

# Обновить access через refresh куку
Invoke-WebRequest -Uri "$base/auth/refresh" -Method Post -WebSession $session | Select-Object -ExpandProperty Content

# Получить список поездок
Invoke-WebRequest -Uri "$base/trips" -Headers @{ Authorization = "Bearer $access" } -WebSession $session | Select-Object -ExpandProperty Content

# Создать заметку (подставьте tripId из списка)
$tripId = "<trip-id>"
Invoke-WebRequest -Uri "$base/notes" -Method Post -ContentType 'application/json' -Headers @{ Authorization = "Bearer $access" } -Body "{`"tripId`":`"$tripId`",`"content`":`"Новая заметка`"}" -WebSession $session | Select-Object -ExpandProperty Content

# Logout (отзывает refresh, чистит куку)
Invoke-WebRequest -Uri "$base/auth/logout" -Method Post -WebSession $session | Select-Object -ExpandProperty Content
```

## Безопасность

- Access: короткий TTL (по умолчанию 15m), только в Authorization Bearer
- Refresh: долгий TTL (по умолчанию 7d), только в HttpOnly cookie, rotation + revoke
- Refresh-сессии хранятся в БД (hash jti, revokedAt, expiresAt)
- CORS: origin из env, credentials: true
- Helmet включён
- Централизованный обработчик ошибок + Zod-валидация
