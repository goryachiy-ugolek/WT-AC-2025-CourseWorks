# Архитектура проекта "Longread Blog"

## Обзор

Full-stack приложение для создания и публикации блог-постов с поддержкой черновиков, тегов, комментариев и лайков.

**Вариант:** 09 — Блог «Лонгрид? Коротко!» ✍️

---

## Технологический стек

### Frontend (apps/web/)

- **Framework:** React 18 + TypeScript
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Styling:** CSS
- **Build:** Create React App

### Backend (apps/server/)

- **Runtime:** Node.js 18+
- **Framework:** Express.js + TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL 14
- **Cache:** Redis 7
- **Auth:** JWT (jsonwebtoken)
- **Security:** Helmet, CORS
- **Logging:** Winston
- **Metrics:** prom-client (Prometheus)

### DevOps

- **Containerization:** Docker, Docker Compose
- **Orchestration:** Kubernetes (Minikube/Cloud)
- **CI/CD:** GitHub Actions
- **Testing:** Jest, Playwright

---

## Архитектура приложения

```
┌─────────────────────────────────────────────────────────────┐
│                         Client (Browser)                     │
│                    React SPA (Port 3000)                     │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/REST
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Port 5000)                   │
│                      Express.js + JWT                        │
├─────────────────────────────────────────────────────────────┤
│  Routes: /auth, /posts, /tags, /comments, /likes, /users    │
│  Middleware: auth, validation, logging, metrics              │
└───────┬──────────────────────┬──────────────────────────────┘
        │                      │
        ▼                      ▼
┌──────────────┐      ┌──────────────┐
│  PostgreSQL  │      │    Redis     │
│   (Port 5432)│      │  (Port 6379) │
│              │      │              │
│  - Users     │      │  - Cache     │
│  - Posts     │      │  - Sessions  │
│  - Tags      │      │              │
│  - Comments  │      │              │
│  - Likes     │      │              │
└──────────────┘      └──────────────┘
```

---

## Структура данных (Database Schema)

### User

```prisma
model User {
  id       Int       @id @default(autoincrement())
  email    String    @unique
  password String    // bcrypt hashed
  name     String
  role     String    // "user" | "admin"
  posts    Post[]
  comments Comment[]
  likes    Like[]
}
```

### Post

```prisma
model Post {
  id        Int       @id @default(autoincrement())
  title     String
  content   String    // Markdown
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  published Boolean   @default(false)
  authorId  Int
  author    User      @relation(fields: [authorId], references: [id])
  tags      PostTag[]
  comments  Comment[]
  likes     Like[]
}
```

### Tag

```prisma
model Tag {
  id    Int       @id @default(autoincrement())
  name  String    @unique
  posts PostTag[]
}
```

### Comment

```prisma
model Comment {
  id        Int      @id @default(autoincrement())
  content   String
  createdAt DateTime @default(now())
  postId    Int
  authorId  Int
  post      Post     @relation(fields: [postId], references: [id])
  author    User     @relation(fields: [authorId], references: [id])
}
```

### Like

```prisma
model Like {
  id       Int  @id @default(autoincrement())
  postId   Int
  userId   Int
  post     Post @relation(fields: [postId], references: [id])
  user     User @relation(fields: [userId], references: [id])
  @@unique([postId, userId])
}
```

---

## API Endpoints

### Authentication

- `POST /auth/register` - Регистрация
- `POST /auth/login` - Вход

### Posts

- `GET /posts` - Список опубликованных постов (с пагинацией)
- `GET /posts/:id` - Один пост
- `POST /posts` - Создать пост (требует auth)
- `PUT /posts/:id` - Обновить пост (требует auth + ownership)
- `DELETE /posts/:id` - Удалить пост (требует auth + ownership)

### Tags

- `GET /tags` - Все теги
- `POST /tags` - Создать тег (требует auth)
- `DELETE /tags/:id` - Удалить тег (admin only)

### Comments

- `GET /comments/post/:postId` - Комментарии к посту
- `POST /comments` - Добавить комментарий (требует auth)
- `DELETE /comments/:id` - Удалить комментарий (требует auth + ownership)

### Likes

- `POST /likes` - Поставить/убрать лайк (требует auth)
- `GET /likes/post/:postId` - Количество лайков

### Users (Admin)

- `GET /users` - Список пользователей (admin only)
- `PUT /users/:id/role` - Изменить роль (admin only)
- `DELETE /users/:id` - Удалить пользователя (admin only)

---

## Авторизация и безопасность

### JWT Authentication

- **Header:** `Authorization: Bearer <token>`
- **Payload:** `{ id: number, role: string }`
- **Expiration:** Настраивается в `.env`

### Роли

- **user:** Может создавать/редактировать свои посты, комментировать, лайкать
- **admin:** Полный доступ + управление пользователями и тегами

### Middleware Chain

```
Request → CORS → Helmet → JSON Parser → Auth Middleware → Route Handler
```

### Валидация

- **Server-side:** Custom validators (`apps/server/src/utils/validation.ts`)
- **Client-side:** Form validation (`apps/web/src/utils/validation.ts`)

---

## Кэширование (Redis)

### Кэшируемые данные

- Списки постов (ключ: `posts:page:{page}`)
- Отдельные посты (ключ: `post:{id}`)
- Теги (ключ: `tags:all`)
- TTL: 300 секунд (5 минут)

### Graceful Degradation

Если Redis недоступен, приложение продолжает работать без кэша.

---

## Observability

### Логирование (Winston)

- **Development:** Цветной вывод в консоль
- **Production:** JSON формат
- **Файлы:**
  - `logs/combined.log` - все логи
  - `logs/error.log` - только ошибки

### Метрики (Prometheus)

- `http_requests_total` - Счетчик HTTP запросов
- `http_request_duration_seconds` - Длительность запросов
- `cache_hits_total` / `cache_misses_total` - Статистика кэша
- **Endpoint:** `GET /metrics`

---

## Deployment

### Docker Compose (Local)

```yaml
services:
  - postgres
  - redis
  - backend (apps/server)
  - frontend (apps/web)
```

### Kubernetes (Production)

```
Namespace: longread-blog
- Deployments: backend (2 replicas), frontend (2 replicas), redis (1 replica)
- StatefulSet: postgres (1 replica + PVC)
- Services: ClusterIP для внутренней связи
- Ingress: HTTP маршрутизация
- ConfigMap: Конфигурация окружения
- Secret: Пароли и JWT секреты
- HPA: Автомасштабирование backend (2-10 pods)
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

1. **backend-lint-test** - Линтинг и unit/integration тесты
2. **frontend-lint-build** - Линтинг и сборка
3. **e2e-tests** - End-to-end тесты (Playwright)
4. **docker-build** - Сборка Docker образов

---

## Файловая структура

```
root/
├── apps/
│   ├── server/              # Backend (Express + Prisma)
│   │   ├── src/
│   │   │   ├── routes/      # API endpoints
│   │   │   ├── middlewares/ # Auth, logging, metrics
│   │   │   ├── utils/       # Helpers, validation
│   │   │   ├── prisma/      # Prisma schema & client
│   │   │   └── __tests__/   # Unit/integration tests
│   │   ├── Dockerfile
│   │   └── package.json
│   └── web/                 # Frontend (React)
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── pages/       # Page components
│       │   ├── services/    # API calls
│       │   └── utils/       # Helpers
│       ├── Dockerfile
│       └── package.json
├── docs/                    # Документация
│   ├── ARCHITECTURE.md      # ← Этот файл
│   ├── QUICKSTART.md        # Быстрый старт
│   ├── TESTING.md           # Тестирование
│   ├── KUBERNETES.md        # Деплой в K8s
│   ├── OBSERVABILITY.md     # Логи и метрики
│   └── CI_CD_SETUP.md       # CI/CD настройка
├── k8s/                     # Kubernetes манифесты
│   └── base/
├── e2e/                     # E2E тесты (Playwright)
├── .github/workflows/       # CI/CD конфигурация
├── docker-compose.yaml      # Локальная разработка
└── README.md                # Главный README
```

---

## Принятые архитектурные решения

### 1. Monorepo структура (apps/)

**Почему:** Упрощает общий код, деплой и версионирование

### 2. TypeScript везде

**Почему:** Типобезопасность, лучший DX, меньше ошибок

### 3. Prisma ORM

**Почему:** Type-safe запросы, автогенерация типов, миграции

### 4. Redis для кэша

**Почему:** Снижение нагрузки на БД, быстрый доступ к часто запрашиваемым данным

### 5. JWT для аутентификации

**Почему:** Stateless, масштабируемость, стандартный подход для REST API

### 6. Prometheus метрики

**Почему:** Стандарт для мониторинга в K8s, легкая интеграция

### 7. Docker + Kubernetes

**Почему:** Портируемость, масштабируемость, industry standard

---
