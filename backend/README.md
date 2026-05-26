# FitSphere Backend

Production-grade Express API for the FitSphere SaaS app.

## Stack

- Node.js + Express.js
- Drizzle ORM
- Turso/libSQL
- JWT access tokens + refresh-token cookies
- bcrypt password hashing
- Zod validation
- Helmet, CORS, express-rate-limit
- Pino structured logging

## Folder Structure

```text
backend/
├── src/
│   ├── config/
│   │   ├── db.js
│   │   ├── env.js
│   │   └── logger.js
│   ├── db/
│   │   └── schema.js
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── trainers/
│   │   ├── clients/
│   │   ├── workouts/
│   │   ├── meals/
│   │   ├── attendance/
│   │   ├── payments/
│   │   ├── goals/
│   │   ├── measurements/
│   │   ├── feedback/
│   │   └── notifications/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── drizzle/
│   └── migrations/
├── scripts/
│   └── seed.js
├── drizzle.config.js
├── package.json
└── .env.example
```

Each feature module owns its route, controller, service, and validation schema.

## Install

```bash
cd backend
npm install
```

## Environment

```bash
cp .env.example .env
```

Set:

```env
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
JWT_ACCESS_SECRET=replace-with-at-least-32-chars
JWT_REFRESH_SECRET=replace-with-at-least-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
IMAGEKIT_PUBLIC_KEY=your-imagekit-public-key
IMAGEKIT_PRIVATE_KEY=your-imagekit-private-key
IMAGEKIT_MEAL_FOLDER=/realm-fit/meals
```

## Turso Setup

```bash
turso db create fitsphere
turso db show fitsphere --url
turso db tokens create fitsphere
```

Put the URL and token in `.env`.

## Migrations

```bash
npm run db:generate
npm run db:migrate
npm run db:migrate:deploy
```

For quick development sync:

```bash
npm run db:push
```

## Seed

```bash
npm run db:seed
```

The seed resets all application data and creates one admin account:

```text
gymadmin@local.com / codsum8623
```

## Run

```bash
npm run dev
```

API base URL:

```text
http://localhost:4000/api/v1
```

## API Surface

### Auth

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/trainer-signup`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

### Core

- `GET /api/v1/users`
- `PATCH /api/v1/users/me`
- `PATCH /api/v1/users/me/password`
- `GET /api/v1/trainers`
- `PATCH /api/v1/trainers/:id/status`
- `GET /api/v1/clients`
- `POST /api/v1/clients`
- `PATCH /api/v1/clients/:id`
- `DELETE /api/v1/clients/:id`
- `GET /api/v1/workouts`
- `POST /api/v1/workouts`
- `GET /api/v1/workouts/today`
- `POST /api/v1/workouts/exercises/:exerciseId/feedback`
- `GET /api/v1/feedback`
- `GET /api/v1/meals`
- `POST /api/v1/meals`
- `GET /api/v1/attendance`
- `POST /api/v1/attendance`
- `GET /api/v1/payments`
- `POST /api/v1/payments`
- `GET /api/v1/goals`
- `POST /api/v1/goals`
- `PATCH /api/v1/goals/:id`
- `DELETE /api/v1/goals/:id`
- `GET /api/v1/measurements`
- `POST /api/v1/measurements`
- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/:id/read`

## Architecture Notes

- Controllers are thin and only translate HTTP to service calls.
- Services own business logic and database operations.
- Zod validates body, params, and query before controllers run.
- `authenticate` loads the current user from JWT.
- `authorize` enforces role-based access and trainer approval.
- Tenant-scoped services use centralized authorization helpers for trainer/client ownership.
- Access tokens are short-lived; refresh tokens rotate through httpOnly cookies and server-side sessions.
- Errors flow through one global error handler.
- Responses use one consistent `{ success, message, data }` envelope.
