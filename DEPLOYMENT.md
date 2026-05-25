# FitSphere Deployment

## Frontend: Vercel

1. Import `https://github.com/Sumeet86S3/Gym-Manage.git` in Vercel.
2. Use the repository root as the project root.
3. Use the default install command or `npm ci`.
4. Use `npm run build` as the build command.
5. Set `VITE_API_URL` to your Render backend URL with `/api/v1`, for example:
   `https://fitsphere-backend.onrender.com/api/v1`

This project uses TanStack Start. Nitro is included in `vite.config.ts` for Vercel-compatible builds.

## Backend: Render

1. Create a new Blueprint in Render from this GitHub repository, or create a Web Service manually.
2. If using Blueprint, Render will read `render.yaml`.
3. Fill all `sync: false` environment variables in the Render dashboard.
4. After Vercel deploys, update `CORS_ORIGIN` to the Vercel frontend URL. For Vercel
   preview deployments, you can include a wildcard origin too:
   `https://your-production-domain.vercel.app,https://*.vercel.app`
5. Confirm the health endpoint responds:
   `https://your-render-backend.onrender.com/api/v1/health`

Manual Render settings:

- Root directory: `backend`
- Build command: `npm ci`
- Start command: `npm start`
- Health check path: `/api/v1/health`
