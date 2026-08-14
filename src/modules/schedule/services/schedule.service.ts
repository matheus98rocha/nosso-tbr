import { createClient } from "@/lib/supabase/client";
import { apiJson } from "@/lib/api/clientJsonFetch";
import {
  ScheduleCreateValidator,
  ScheduleDomain,
} from "../types/schedule.types";
import { ScheduleUpsertMapper } from "./mappers/schedule.mapper";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";

export class ScheduleUpsertService {
  private supabase = createClient();

  async createMany(schedules: ScheduleCreateValidator[]): Promise<void> {
    try {
      const serializable = schedules.map((s) => ({
        book_id: s.book_id,
        owner: s.owner,
        date: s.date instanceof Date ? s.date.toISOString() : s.date,
        chapters: s.chapters,
        completed: s.completed,
      }));

      await apiJson<{ ok: true }>("/api/schedule", {
        method: "POST",
        body: JSON.stringify({ schedules: serializable }),
      });
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "ScheduleService",
        method: "createMany",
        schedules,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }
  async getByBookId(bookId: string, userId: string): Promise<ScheduleDomain[]> {
    try {
      const { data, error } = await this.supabase
        .from("schedule")
        .select("*")
        .eq("book_id", bookId)
        .eq("owner", userId)
        .order("date", { ascending: true });

      if (error) {
        throw new RepositoryError(
          "Falha ao buscar cronograma",
          undefined,
          undefined,
          error,
          { bookId },
        );
      }

      return data.map((row) => ScheduleUpsertMapper.toDomain(row));
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "ScheduleService",
        method: "getByBookId",
        bookId,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }
  async updateIsRead(
    scheduleId: string,
    isCompleted: boolean,
    owner: string,
  ): Promise<void> {
    try {
      void owner;
      await apiJson<{ ok: true }>(
        `/api/schedule/${encodeURIComponent(scheduleId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ completed: isCompleted }),
        },
      );
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "ScheduleService",
        method: "updateIsRead",
        scheduleId,
        isCompleted,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }
  async deleteSchedule(bookId: string, userId: string): Promise<void> {
    try {
      void userId;
      const q = new URLSearchParams({ bookId });
      await apiJson<{ ok: true }>(`/api/schedule?${q.toString()}`, {
        method: "DELETE",
      });
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "ScheduleService",
        method: "deleteSchedule",
        bookId,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }
}
