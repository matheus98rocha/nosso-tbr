import {
  ScheduleCreateValidator,
  ScheduleDomain,
  SchedulePersistence,
} from "../../types/schedule.types";

export class ScheduleUpsertMapper {
  static toPersistence(
    domain: ScheduleCreateValidator,
    extra?: Partial<SchedulePersistence>
  ): SchedulePersistence {
    return {
      book_id: domain.book_id,
      date: domain.date,
      chapters: Array.isArray(domain.chapters)
        ? domain.chapters.join(", ")
        : domain.chapters ?? "",
      completed: domain.completed ?? false,
      created_at: extra?.created_at,
    };
  }

  static toDomain(persistence: SchedulePersistence): ScheduleDomain {
    return {
      id: persistence.id,
      date: persistence.date ? new Date(persistence.date).toISOString() : "",
      chapters: persistence.chapters || "",
      completed: persistence.completed ?? false,
    };
  }
}
