export type ScheduleFormInput = {
  totalChapters: number;
  startDate: Date;
  includePrologue?: boolean;
  includeEpilogue?: boolean;
  roundUp?: boolean;
  includeWeekends?: boolean;
};
