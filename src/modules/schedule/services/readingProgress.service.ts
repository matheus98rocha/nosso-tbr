import { apiJson } from "@/lib/api/clientJsonFetch";
import { ErrorHandler } from "@/services/errors/error";
import type { ReadingProgressPersistence } from "../types/readingProgress.types";

export class ReadingProgressService {
  async getMany(
    bookIds: readonly string[],
  ): Promise<ReadingProgressPersistence[]> {
    if (bookIds.length === 0) {
      return [];
    }

    try {
      const search = new URLSearchParams({ bookIds: bookIds.join(",") });
      return await apiJson<ReadingProgressPersistence[]>(
        `/api/schedule/progress?${search.toString()}`,
        { method: "GET" },
      );
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "ReadingProgressService",
        method: "getMany",
        bookIds,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }
}
