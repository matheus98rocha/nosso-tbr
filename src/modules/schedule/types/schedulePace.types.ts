export type SchedulePaceStatus = "on_time" | "ahead" | "behind";

export type SchedulePaceDomain = {
  status: SchedulePaceStatus;
  overdueDays: number;
  aheadDays: number;
  plannedEndDate: Date;
  predictedEndDate: Date;
};

export type SchedulePaceAggregatesInput = {
  overdue?: number;
  ahead?: number;
  lastDate?: Date | string;
};

export type SchedulePaceRow = {
  date: Date | string;
  completed: boolean;
};

export type SchedulePaceByBookId = Map<string, SchedulePaceDomain>;

export type SchedulePaceLabels = {
  caption: string;
  dateText: string;
  predictedEnd: string;
  delay: string | null;
  statusLabel: string;
  ariaLabel: string;
};
