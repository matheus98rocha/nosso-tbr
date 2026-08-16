import type {
  SchedulePaceDomain,
  SchedulePaceLabels,
  SchedulePaceStatus,
} from "@/modules/schedule/types/schedulePace.types";

export type SchedulePaceLabelVariant = "card" | "page";

export type SchedulePaceLabelProps = {
  pace: SchedulePaceDomain | null;
  variant: SchedulePaceLabelVariant;
  className?: string;
};

export type SchedulePaceLabelViewModel = {
  shouldRender: boolean;
  labels: SchedulePaceLabels | null;
  isCard: boolean;
  status: SchedulePaceStatus | null;
  dateTime: string;
  shortCaption: string;
  showStatusChip: boolean;
  rootClassName: string;
  iconWellClassName: string;
  iconClassName: string;
  captionClassName: string;
  shortCaptionClassName: string;
  dateClassName: string;
  chipClassName: string;
  delayClassName: string;
};
