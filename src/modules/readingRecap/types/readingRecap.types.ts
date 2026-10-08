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
  id: string;
  title: string;
  endDate: string;
  gender: string | null;
  imageUrl: string | null;
};

export type RecapImageCover = {
  bookId: string;
  title: string;
  src: string;
};

export type RecapImage = {
  title: string;
  subtitle: string | null;
  covers: RecapImageCover[];
  coverSrcs: string[];
};

export type BuildReadingRecapInput = {
  books: RecapBook[];
  filter: RecapFilter;
};

export type ReadingRecapModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export type UseVisibleRecapCoversResult = {
  visibleCovers: RecapImageCover[];
  handleCoverError: (bookId: string) => void;
};

export type UseLoadableRecapBooksResult = {
  loadableBooks: RecapBook[];
  isProbing: boolean;
};

export type ReadingRecapPreviewProps = {
  image: RecapImage | null;
  periodTitle: string;
  isEmpty: boolean;
  isLoading: boolean;
  isError: boolean;
  imageCount?: number;
  imageIndex?: number;
  emptyCaption?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  onSelectImage?: (index: number) => void;
  onRemoveBook?: (bookId: string) => void;
};

export type RecapPreviewCoverProps = {
  cover: RecapImageCover;
  onRemove?: (bookId: string) => void;
  onCoverError?: (bookId: string) => void;
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
  isGenderFilterEnabled: boolean;
  onPeriodKindChange: (kind: RecapPeriodKind) => void;
  onAnchorDateChange: (date: Date | undefined) => void;
  onMonthChange: (month: string) => void;
  onYearChange: (year: string) => void;
  onToggleGender: (gender: string) => void;
  onGenderFilterEnabledChange: (enabled: boolean) => void;
};
