"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ReadingRatingStarsRow from "@/modules/bookRating/components/readingRatingStarsRow";
import { useUserStore } from "@/stores/userStore";
import {
  useRemoveReadingRatingMutation,
  useSaveReadingRatingMutation,
} from "@/modules/bookRating/hooks/useReadingRatingMutations";
import { toast } from "sonner";

type FinishedReadingRatingDialogProps = {
  bookId: string | null;
  open: boolean;
  onDismiss: () => void;
  initialStars?: number | null;
};

export default function FinishedReadingRatingDialog({
  bookId,
  open,
  onDismiss,
  initialStars = null,
}: FinishedReadingRatingDialogProps) {
  const userId = useUserStore((s) => s.user?.id);
  const [draft, setDraft] = useState<number | null>(null);
  const [baselineStars, setBaselineStars] = useState<number | null>(null);
  const { saveStars, isPending: isSaving } =
    useSaveReadingRatingMutation(userId);
  const { removeRating, isPending: isRemoving } =
    useRemoveReadingRatingMutation(userId);

  const isPending = isSaving || isRemoving;

  useEffect(() => {
    if (open) {
      const next = initialStars ?? null;
      setDraft(next);
      setBaselineStars(next);
    }
  }, [open, bookId, initialStars]);

  const suffix = bookId ?? "dialog";

  const handleSkip = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  const handleSave = useCallback(async () => {
    if (!bookId || draft === null || draft < 1 || draft > 5) return;
    try {
      await saveStars(bookId, draft);
      onDismiss();
    } catch {
      toast.error("Não foi possível salvar a avaliação. Tente de novo.", {
        className: "toast-error",
      });
    }
  }, [bookId, draft, onDismiss, saveStars]);

  const handleRemove = useCallback(async () => {
    if (!bookId || baselineStars === null || baselineStars < 1) return;
    try {
      await removeRating(bookId);
      onDismiss();
    } catch {
      toast.error("Não foi possível remover a avaliação.", {
        className: "toast-error",
      });
    }
  }, [baselineStars, bookId, onDismiss, removeRating]);

  const canSubmit = draft !== null && draft >= 1 && draft <= 5;
  const canRemove =
    baselineStars !== null && baselineStars >= 1 && baselineStars <= 5;

  const title = useMemo(
    () => "Como foi esta leitura para você?",
    [],
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onDismiss()}>
      <DialogContent
        aria-describedby={undefined}
        className="max-w-[min(100vw-2rem,24rem)]"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-left text-sm text-muted-foreground">
            Avalie de 1 a 5 estrelas. Você pode pular agora e registrar ou
            alterar depois pelo botão no cartão.
          </p>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <ReadingRatingStarsRow
            displayValue={draft}
            disabled={isPending || !bookId}
            ariaOwnsSuffix={suffix}
            onPick={(n) => setDraft(n)}
          />
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={isPending}
            >
              Pular por agora
            </Button>
            {canRemove ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => void handleRemove()}
                disabled={isPending || !bookId}
              >
                Remover avaliação
              </Button>
            ) : null}
          </div>
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => void handleSave()}
            disabled={isPending || !canSubmit || !bookId}
          >
            Salvar avaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
