export type BookImportStatus = "not_started" | "reading" | "finished";

export type BookImportRejectedReason = "invalid" | "duplicate";

export type BookImportRejectedRow = {
  title: string | null;
  reason: BookImportRejectedReason;
};

export type BookImportCandidate = {
  title: string;
  authorName: string;
  pages: number;
  status: BookImportStatus;
  endDate: string | null;
};

export type ParsedBookImport =
  | { kind: "refused"; message: string }
  | {
      kind: "rows";
      candidates: BookImportCandidate[];
      rejectedRows: BookImportRejectedRow[];
    };
