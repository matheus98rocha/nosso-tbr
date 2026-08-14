import { ApiError } from "./clientJsonFetch";

export function isUnauthorizedError(error: unknown): boolean {
  return (
    (error instanceof ApiError && error.status === 401) ||
    (error instanceof Error && error.message === "Unauthorized")
  );
}
