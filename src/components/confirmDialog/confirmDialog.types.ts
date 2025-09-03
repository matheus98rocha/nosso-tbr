export type ConfirmDialogProps = {
    title: string;
    description: string;
    id: string;
    queryKeyToInvalidate: string;
    onConfirm: (id: string) => Promise<void>;
    onCancel?: () => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    buttonLabel?: string;
};