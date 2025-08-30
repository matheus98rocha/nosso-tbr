export type ScheduleCreateValidator = {
  book_id: string;
  date: Date;
  chapters: string;
  completed?: boolean;
};

export type SchedulePersistence = {
  id?: string;
  book_id: string;
  date: Date;
  chapters: string;
  completed: boolean;
  created_at?: string;
};

export type ScheduleDomain = {
  id?: string;
  date: string;
  chapters: string;
  completed: boolean;
};

export type ClientScheduleProps = {
  id: string;
  startDate: string;
  title: string;
};

export type ScheduleInput = {
  totalChapters: number;
  startDate: Date;
  includePrologue?: boolean;
  chaptersPerDay?: number;
  includeWeekends?: boolean;
};

export type DailySchedule = {
  date: Date;
  chapters: string;
};
