import { ReactNode } from "react";

export type DropdownMenuWrapperProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  editBook: () => void;
  removeBook: () => void;
  addToShelf: () => void;
  shareOnWhatsApp: () => void;
  schedule?: () => void;
  quotes?: () => void;
  isEndReading?: boolean;
  quotesDisabled?: boolean;
};
