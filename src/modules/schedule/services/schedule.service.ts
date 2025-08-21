import { createClient } from "@/lib/supabase/client";
import { ScheduleCreateValidator } from "../types/schedule.types";
import { ScheduleUpsertMapper } from "./mappers/schedule.mapper";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";

export class ScheduleUpsertService {
  private supabase = createClient();

  async createMany(schedules: ScheduleCreateValidator[]): Promise<void> {
    try {
      const payload = schedules.map((schedule) =>
        ScheduleUpsertMapper.toPersistence(schedule)
      );

      const { error } = await this.supabase.from("schedule").insert(payload);

      if (error) {
        throw new RepositoryError(
          "Falha ao criar cronograma",
          undefined,
          undefined,
          error,
          { schedules }
        );
      }
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
  async getByBookId(bookId: string): Promise<ScheduleCreateValidator[]> {
    try {
      const { data, error } = await this.supabase
        .from("schedule")
        .select("*")
        .eq("book_id", bookId)
        .order("date", { ascending: true });

      if (error) {
        throw new RepositoryError(
          "Falha ao buscar cronograma",
          undefined,
          undefined,
          error,
          { bookId }
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
}
