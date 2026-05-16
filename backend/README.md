# FitSphere Backend

Dependency-free Node REST API for the FitSphere frontend.

## Run

```bash
npm run backend
```

The API starts on `http://localhost:4000` by default. Override with:

```bash
PORT=5000 npm run backend
```

On first run it creates `backend/data/db.json` with seeded demo data.

## Demo Accounts

All seeded accounts use password `password123`.

| Role | Email |
| --- | --- |
| Admin | `admin@fitsphere.com` |
| Trainer | `trainer@fitsphere.com` |
| Client | `client@fitsphere.com` |

## Auth

Send the returned token on protected routes:

```http
Authorization: Bearer <token>
```

## Main Routes

### Auth

- `POST /api/auth/login`
- `POST /api/auth/trainer-signup`
- `GET /api/auth/me`
- `PATCH /api/users/me`
- `PATCH /api/users/me/password`

### Admin

- `GET /api/admin/dashboard`
- `GET /api/admin/trainers?status=Pending`
- `PATCH /api/admin/trainers/:id/status`
- `GET /api/admin/reports`

### Trainer

- `GET /api/trainer/dashboard`
- `GET /api/trainer/clients`
- `POST /api/trainer/clients`
- `PATCH /api/trainer/clients/:id`
- `DELETE /api/trainer/clients/:id`
- `GET /api/trainer/attendance`
- `POST /api/trainer/attendance`
- `GET /api/trainer/workouts`
- `POST /api/trainer/workouts`
- `GET /api/trainer/feedback`
- `GET /api/trainer/meals`
- `GET /api/trainer/measurements`
- `POST /api/trainer/measurements`
- `GET /api/trainer/goals`
- `GET /api/trainer/payments`

### Client

- `GET /api/client/workout`
- `POST /api/client/workout/:exerciseId/feedback`
- `GET /api/client/meals`
- `POST /api/client/meals`
- `GET /api/client/progress`
- `GET /api/client/payments`
- `GET /api/client/goals`

## Notes

This is a local-first backend meant to replace the current mock data cleanly. For production, move `backend/data/db.json` to PostgreSQL or another real database, set a strong `JWT_SECRET`, and store meal images in Cloudflare R2, S3, or Cloudinary.
