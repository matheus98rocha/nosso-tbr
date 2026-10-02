import { BookDomain } from "@/types/books.types";

import type { BookImportResult } from "./components/bookImportPanel/bookImportPanel.types";

export type {
  BookImportFileRefusedResult,
  BookImportRejectedReason,
  BookImportRejectedRow,
  BookImportResult,
  BookImportRowReportResult,
} from "./components/bookImportPanel/bookImportPanel.types";

export type CreateBookProps = {
  bookData?: BookDomain;
  isBookFormOpen: boolean;
  setIsBookFormOpen: (open: boolean) => void;
  initialLookupQuery?: string | null;
  importResult?: BookImportResult | null;
  onImportBooks?: (file: File) => void;
};

export type UseCreateBookDialog = {
  isBookFormOpen: boolean;
  bookData: BookDomain | undefined;
  setIsBookFormOpen: (open: boolean) => void;
  chosenByOptions: {
    label: string;
    value: string;
  }[];
};
