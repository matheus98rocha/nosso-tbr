export type FinishedBookShareSubject = {
  bookId: string;
  title: string;
  author: string | null;
  imageUrl: string | null;
};

export type FinishedBookShareDialogProps = {
  subject: FinishedBookShareSubject;
  open: boolean;
  onClose: () => void;
};

export type ShareFinishedBookOnXButtonProps = {
  bookId: string;
  title: string;
  author: string | null;
  imageUrl: string | null;
};
