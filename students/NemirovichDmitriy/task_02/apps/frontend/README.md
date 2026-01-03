# Frontend (Поехали!) — SPA Клиент

## Стек

- React 18 + TypeScript
- Vite
- React Router DOM
- React Hook Form + Zod
- Axios

## Требования

- Node.js 18+
- Backend запущен на `http://localhost:4000` (или настройте `VITE_API_URL`)

## Запуск

1) Установить зависимости в корне монорепо:

```bash
npm install
```

1) Настроить окружение:

```bash
cp apps/frontend/.env.example apps/frontend/.env
# Отредактируйте VITE_API_URL если нужно
```

1) Запустить dev-сервер (отдельно):

```bash
npm run dev:frontend
# http://localhost:5173
```

> Можно стартовать вместе с backend одной командой из корня: `npm run dev`

## Backend URL

По умолчанию: `http://localhost:4000`

Измените в `.env`:

```
VITE_API_URL=http://localhost:4000
```

## Тестовые пользователи (после seed на backend)

| Email             | Пароль     | Роль  |
|-------------------|------------|-------|
| admin@example.com | Admin1234  | admin |
| user1@example.com | User1234   | user  |
| user2@example.com | User2234   | user  |

## Реализованные сценарии

### Аутентификация

- ✅ Регистрация нового пользователя
- ✅ Вход в систему
- ✅ Автоматическое обновление access token (при 401 → refresh → retry)
- ✅ Выход из системы
- ✅ Восстановление сессии при перезагрузке страницы

### Поездки (Trips)

- ✅ Список своих поездок (owner + participant)
- ✅ Создание поездки
- ✅ Просмотр детальной информации
- ✅ Редактирование (только owner/admin)
- ✅ Удаление (только owner/admin)
- ✅ Шаринг — добавление участника по UUID (только owner)
- ✅ Удаление участника (owner или сам участник)

### Остановки (Stops)

- ✅ Список остановок маршрута
- ✅ Создание остановки
- ✅ Редактирование
- ✅ Удаление

### Заметки (Notes)

- ✅ Список заметок поездки
- ✅ Создание заметки
- ✅ Редактирование (только автор)
- ✅ Удаление (автор / owner / admin)

### Расходы (Expenses)

- ✅ Список расходов поездки
- ✅ Создание расхода
- ✅ Редактирование (только автор)
- ✅ Удаление (автор / owner / admin)
- ✅ Суммарная статистика потраченного

## Учёт ролей

- **Обычный пользователь (user)**: видит только свои поездки и те, где является участником
- **Администратор (admin)**: видит все поездки, может редактировать и удалять любые
- Кнопки редактирования/удаления скрываются, если у пользователя нет прав
- При попытке доступа к чужим ресурсам — понятное сообщение об ошибке

## Безопасность

- Access token хранится ТОЛЬКО в памяти (React Context)
- Refresh token хранится в HttpOnly cookie на backend
- Все запросы с `credentials: 'include'` для передачи cookie
- При 401 автоматически пробуем refresh, при неудаче — logout
- Никаких данных в localStorage/sessionStorage
- Axios клиент создаётся с `withCredentials: true` и перехватчиком для `POST /auth/refresh`

## Архитектура

```
src/
├── api/           # API клиент и модули (auth, trips, stops, notes, expenses)
├── components/    # UI компоненты (Layout, Modal, ErrorAlert, etc.)
├── context/       # AuthContext с access token в памяти
├── pages/         # Страницы приложения
├── styles/        # CSS стили
├── types/         # TypeScript типы (синхронизированы с backend)
└── utils/         # Утилиты (errors, date formatting)
```

## Демонстрация

1. Выполните seed: `npm run prisma:seed -w backend`
2. Запустите оба сервиса: `npm run dev`
3. Откройте http://localhost:5173
4. Войдите как `user1@example.com` / `User1234`
5. Увидите поездку "Поездка в Стамбул" с остановками, заметками и расходами
6. Создайте новую поездку, добавьте остановку, заметку, расход, расшарьте по UUID пользователя
