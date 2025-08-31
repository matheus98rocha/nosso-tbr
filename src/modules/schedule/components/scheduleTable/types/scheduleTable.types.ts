import { ScheduleDomain } from "@/modules/schedule/types/schedule.types";

export type ScheduleTableProps = {
  schedule?: ScheduleDomain[];
  bookId: string;
  updateIsCompleted: (payload: { id: string; isRead: boolean }) => void;
  deleteSchedule: (id: string) => Promise<void>;
};
