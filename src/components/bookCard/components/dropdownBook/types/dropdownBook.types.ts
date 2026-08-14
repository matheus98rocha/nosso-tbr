import { ReactNode } from "react";

export type DropdownMenuWrapperProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  editBook: () => void;
  removeBook: () => void;
  removeBookLabel: string;
  addToShelf: () => void;
  shareOnWhatsApp: () => void;
  schedule?: () => void;
  quotes?: () => void;
  isFinishedReading?: boolean;
  quotesDisabled?: boolean;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
  favoriteActionBusy?: boolean;
};
