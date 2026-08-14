import { useCallback, useMemo, useState, type MouseEvent } from "react";

import type {
  CardStartReadingConfirmationCopy,
  UseCardStartReadingButtonParams,
} from "../types/cardStartReadingButton.types";

export function useCardStartReadingButton({
  bookTitle,
  label,
  onStartReading,
  isPending = false,
}: UseCardStartReadingButtonParams) {
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  const confirmationCopy = useMemo((): CardStartReadingConfirmationCopy => {
    if (label === "Reiniciar leitura") {
      return {
        title: "Reiniciar leitura?",
        description: `Ao confirmar, “${bookTitle}” voltará ao status de leitura em andamento.`,
        confirmLabel: "Reiniciar leitura",
      };
    }

    return {
      title: "Iniciar leitura?",
      description: `Ao confirmar, “${bookTitle}” passará a aparecer como leitura em andamento na sua biblioteca.`,
      confirmLabel: "Iniciar leitura",
    };
  }, [bookTitle, label]);

  const handleOpenConfirmation = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (isPending) return;
      setConfirmationOpen(true);
    },
    [isPending],
  );

  const handleConfirm = useCallback(() => {
    onStartReading();
    setConfirmationOpen(false);
  }, [onStartReading]);

  const handleCancel = useCallback(() => {
    setConfirmationOpen(false);
  }, []);

  return {
    confirmationOpen,
    setConfirmationOpen,
    confirmationCopy,
    handleOpenConfirmation,
    handleConfirm,
    handleCancel,
  };
}
