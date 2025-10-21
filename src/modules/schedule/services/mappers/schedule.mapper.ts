import { DateUtils } from "@/utils/date/date.utils";
import {
  ScheduleCreateValidator,
  ScheduleDomain,
  SchedulePersistence,
} from "../../types/schedule.types";

export class ScheduleUpsertMapper {
  static formateScheduleDate(date: Date | string): Date {
    const inputDate = date instanceof Date ? date : new Date(date);

    const year = inputDate.getFullYear();
    const month = String(inputDate.getMonth() + 1).padStart(2, "0");
    const day = String(inputDate.getDate()).padStart(2, "0");

    const dateString = `${year}-${month}-${day}T00:00:00-03:00`;

    const brazilianDateAtMidnight = new Date(dateString);
    return brazilianDateAtMidnight;
  }
  static toPersistence(
    domain: ScheduleCreateValidator,
    extra?: Partial<SchedulePersistence>
  ): SchedulePersistence {
    const domainDate: Date =
      domain.date instanceof Date ? domain.date : new Date(domain.date);
    const dateAtBrazilianMidnight = this.formateScheduleDate(domainDate);

    return {
      book_id: domain.book_id,
      date: dateAtBrazilianMidnight,
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
