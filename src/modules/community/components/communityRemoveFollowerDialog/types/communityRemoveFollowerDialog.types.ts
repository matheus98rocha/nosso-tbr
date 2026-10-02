export type CommunityRemoveFollowerDialogProps = {
  displayName: string | null;
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};
