import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConfirmDialogProps } from "./confirmDialog.types";

export const useConfirmDialog = ({onConfirm, id, queryKeyToInvalidate, onOpenChange}: ConfirmDialogProps) => {
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
        isLoading
    }
};