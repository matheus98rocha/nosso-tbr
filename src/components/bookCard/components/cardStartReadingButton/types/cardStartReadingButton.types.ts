export type CardStartReadingConfirmationCopy = {
  title: string;
  description: string;
  confirmLabel: string;
};

export type CardStartReadingButtonProps = {
  bookTitle: string;
  onStartReading: () => void;
  isPending?: boolean;
  label?: string;
  className?: string;
};

export type UseCardStartReadingButtonParams = {
  bookTitle: string;
  label: string;
  onStartReading: () => void;
  isPending?: boolean;
};
