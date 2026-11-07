// Server-only helper for calling the FastAPI backend. Import it only from
// route handlers / server code: BACKEND_API_KEY must never reach the browser.

const BACKEND_URL =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class BackendConfigError extends Error {}

/** fetch() against the backend with the shared X-Backend-Key header. */
export function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const key = process.env.BACKEND_API_KEY;
  if (!key) {
    throw new BackendConfigError("BACKEND_API_KEY is not set on the frontend server");
  }
  const headers = new Headers(init.headers);
  headers.set("X-Backend-Key", key);
  return fetch(`${BACKEND_URL}${path}`, { ...init, headers });
}
