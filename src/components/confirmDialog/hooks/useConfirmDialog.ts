import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ConfirmDialogProps } from "../confirmDialog.types";

type UseConfirmDialogArgs = Pick<
  ConfirmDialogProps,
  "onConfirm" | "id" | "queryKeyToInvalidate" | "onOpenChange"
>;

export function useConfirmDialog({
  onConfirm,
  id,
  queryKeyToInvalidate,
  onOpenChange,
}: UseConfirmDialogArgs) {
  const queryClient = useQueryClient();

  const { mutate: confirmBookMutation, isPending: isLoading } = useMutation({
    mutationFn: () => onConfirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeyToInvalidate] });
      onOpenChange(false);
    },
  });

  return {
    confirmBookMutation,
    isLoading,
  };
}
