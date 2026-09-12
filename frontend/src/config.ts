/**
 * Centralized API Base URL configuration for Stats-O-Locked Offer Letter system.
 *
 * This project deploys as ONE combined Vercel project (see root vercel.json),
 * where "/api/:path*" is rewritten from the frontend domain straight to the
 * backend service. That means in production the frontend and API share the
 * same origin, so the correct base URL is simply '' (relative /api/... calls) —
 * there is no separate backend domain to hardcode or keep in sync.
 *
 * Local Development:
 * The Vite dev server and the Express backend run as two separate processes
 * on two different ports, so a real absolute URL is needed. Defaults to
 * 'http://localhost:5000', overridable via VITE_API_URL in .env / .env.development.
 *
 * If you ever split frontend and backend into two separate Vercel projects,
 * set VITE_API_URL in that project's Vercel dashboard to the backend's full URL
 * (e.g. https://your-backend.vercel.app) and this will pick it up automatically.
 */
const isProd = (import.meta as any).env?.PROD === true;
const envApiUrl = (import.meta as any).env?.VITE_API_URL;

export const API_BASE_URL = (
  envApiUrl !== undefined && envApiUrl !== ''
    ? envApiUrl
    : isProd
      ? ''
      : 'http://localhost:5000'
).replace(/\/$/, '');
