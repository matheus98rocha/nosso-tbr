import type {
  FocusBook,
  FocusMode,
  FocusSummaryInput,
  FocusTimerStatus,
} from "./focus.types";

export type FocusModeToggleProps = {
  mode: FocusMode;
  disabled?: boolean;
  onChange: (mode: FocusMode) => void;
};

export type FocusBookPickerProps = {
  books: readonly FocusBook[];
  selectedBookId: string | null;
  disabled?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  onSelect: (bookId: string | null) => void;
};

export type FocusBookCardProps = {
  book: FocusBook;
};

export type FocusGoalFieldsProps = {
  durationMinutes: number;
  goalInput: string;
  goalPages: number | null;
  error: string | null;
  presets: readonly number[];
  maxPages: number;
  suggestedMinutes: number | null;
  estimatedPages: number;
  remainingMinutes: number | null;
  speed: number;
  book: FocusBook | null;
  currentPageInput: string;
  targetPageInput: string;
  targetPage: number | null;
  pageRangeError: string | null;
  disabled?: boolean;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onPreset: (pages: number) => void;
  onClear: () => void;
  onCurrentPageChange: (value: string) => void;
  onTargetPageChange: (value: string) => void;
  onAcceptSuggestion: () => void;
  onDurationChange: (minutes: number) => void;
};

export type FocusSoundToggleProps = {
  muted: boolean;
  onToggle: () => void;
};

export type FocusTimerProps = {
  mode: FocusMode;
  status: FocusTimerStatus;
  displaySeconds: number;
  progress: number;
  durationMinutes: number;
  goalPages: number | null;
  estimatedPages: number;
  remainingMinutes: number | null;
  suggestedMinutes: number | null;
  speed: number;
  book: FocusBook | null;
  books: readonly FocusBook[];
  booksLoading: boolean;
  booksError: boolean;
  goalInput: string;
  inputError: string | null;
  currentPageInput: string;
  targetPageInput: string;
  targetPage: number | null;
  pageRangeError: string | null;
  muted: boolean;
  canFinish: boolean;
  onModeChange: (mode: FocusMode) => void;
  onBookChange: (bookId: string | null) => void;
  onGoalInputChange: (value: string) => void;
  onGoalSubmit: () => void;
  onGoalPreset: (pages: number) => void;
  onGoalClear: () => void;
  onCurrentPageChange: (value: string) => void;
  onTargetPageChange: (value: string) => void;
  onAcceptSuggestion: () => void;
  onDurationChange: (minutes: number) => void;
  onToggleMute: () => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onFinishSession: () => void;
};

export type FocusSessionDialogProps = {
  summary: FocusSummaryInput | null;
  suggestedPage: number;
  isSaving: boolean;
  onConfirm: (page: number) => void;
  onCancel: () => void;
};

export type FocusScreenViewModel = FocusTimerProps & {
  summary: FocusSummaryInput | null;
  suggestedPage: number;
  isSaving: boolean;
  onConfirmSummary: (page: number) => void;
  onCancelSummary: () => void;
};
