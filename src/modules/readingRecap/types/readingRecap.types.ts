export type RecapPeriodKind = "day" | "month" | "year";

export type RecapPeriod = {
  kind: RecapPeriodKind;
  year: number;
  month?: number;
  day?: number;
};

export type RecapFilter = {
  period: RecapPeriod;
  genders: string[];
};

export type RecapBook = {
  title: string;
  endDate: string;
  gender: string | null;
  imageUrl: string | null;
};

export type RecapImage = {
  title: string;
  subtitle: string | null;
  coverSrcs: string[];
};

export type BuildReadingRecapInput = {
  books: RecapBook[];
  filter: RecapFilter;
  placeholderSrc: string;
};

export type ReadingRecapModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export type ReadingRecapPreviewProps = {
  image: RecapImage | null;
  periodTitle: string;
  isEmpty: boolean;
  isLoading: boolean;
  isError: boolean;
};

export type RecapSelectOption = {
  value: string;
  label: string;
};

export type ReadingRecapFiltersProps = {
  filter: RecapFilter;
  anchorDate: Date;
  monthOptions: RecapSelectOption[];
  yearOptions: number[];
  onPeriodKindChange: (kind: RecapPeriodKind) => void;
  onAnchorDateChange: (date: Date | undefined) => void;
  onMonthChange: (month: string) => void;
  onYearChange: (year: string) => void;
  onToggleGender: (gender: string) => void;
};
