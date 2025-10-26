import { DateUtils } from "@/utils/date/date.utils";
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
    let dateForPersistence: string;

    if (domain.date instanceof Date) {
      dateForPersistence = DateUtils.dateToISO(domain.date);
    } else if (typeof domain.date === "string") {
      dateForPersistence = DateUtils.ptBRToISO(domain.date);
    } else {
      dateForPersistence = "";
    }

    return {
      book_id: domain.book_id,
      date: dateForPersistence as unknown as Date,
      chapters: Array.isArray(domain.chapters)
        ? domain.chapters.join(", ")
        : domain.chapters ?? "",
      completed: domain.completed ?? false,
      created_at: extra?.created_at,
    };
  }

  static toDomain(persistence: SchedulePersistence): ScheduleDomain {
    const dateForDomain = DateUtils.isoToPtBR(
      persistence.date as unknown as string
    );

    return {
      id: persistence.id,
      date: dateForDomain,
      chapters: persistence.chapters || "",
      completed: persistence.completed ?? false,
    };
  }
}
