export type ReaderCandidate = {
  id: string;
  displayName: string;
  email: string;
};

export type AddBookReaderDialogProps = {
  open: boolean;
  bookTitle: string;
  term: string;
  candidates: ReaderCandidate[];
  isSearching: boolean;
  shouldSearch: boolean;
  pendingUserId: string | null;
  onOpenChange: (open: boolean) => void;
  onTermChange: (value: string) => void;
  onSelect: (candidate: ReaderCandidate) => void;
};

export type AddBookReaderState = Omit<AddBookReaderDialogProps, "bookTitle"> & {
  openDialog: () => void;
};
