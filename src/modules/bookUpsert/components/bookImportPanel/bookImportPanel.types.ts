import type { ChangeEvent, DragEvent } from "react";

export type BookEntryMode = "single" | "bulk";

export type BookImportRejectedReason = "invalid" | "duplicate";

export type BookImportRejectedRow = {
  title?: string | null;
  reason: BookImportRejectedReason;
};

export type BookImportFileRefusedResult = {
  kind: "refused";
  message: string;
};

export type BookImportRowReportResult = {
  kind: "report";
  createdCount: number;
  rejectedCount: number;
  rejectedRows: BookImportRejectedRow[];
};

export type BookImportResult =
  | BookImportFileRefusedResult
  | BookImportRowReportResult;

export type BookImportResultViewProps = {
  result: BookImportResult;
};

export type BookImportPanelProps = {
  fileName: string | null;
  fileSizeLabel: string | null;
  isDragging: boolean;
  result: BookImportResult | null;
  onDragLeave: (event: DragEvent<HTMLLabelElement>) => void;
  onDragOver: (event: DragEvent<HTMLLabelElement>) => void;
  onDrop: (event: DragEvent<HTMLLabelElement>) => void;
  onFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
};

export type BookEntryModeSwitchProps = {
  mode: BookEntryMode;
  onModeChange: (mode: BookEntryMode) => void;
};

export type UseBookImportEntryParams = {
  isOpen: boolean;
  onImportBooks?: (file: File) => void;
};
