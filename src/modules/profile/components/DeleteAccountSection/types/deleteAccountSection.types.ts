export type DeleteAccountSectionProps = {
  description: string;
  isConfirmOpen: boolean;
  userId: string;
  onOpenConfirm: () => void;
  onCloseConfirm: () => void;
  onConfirmOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => Promise<void>;
};
