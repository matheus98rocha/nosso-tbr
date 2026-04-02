import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BookParticipationBlockedDialogProps } from "../types/bookParticipationBlockedDialog.types";

export const BookParticipationBlockedDialog = memo(
  function BookParticipationBlockedDialog({
    open,
    bookTitle,
    onDismiss,
  }: BookParticipationBlockedDialogProps) {
    return (
      <Dialog open={open} onOpenChange={(next) => !next && onDismiss()}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Você já participa desta leitura</DialogTitle>
            <DialogDescription>
              Esse livro já está no seu perfil porque você é o leitor responsável
              (escolhido por) ou já faz parte da leitura conjunta. Não é possível
              cadastrar de novo
              {bookTitle ? (
                <>
                  {" "}
                  <span className="font-medium text-foreground">{bookTitle}</span>
                </>
              ) : null}
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={onDismiss}>
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);

BookParticipationBlockedDialog.displayName = "BookParticipationBlockedDialog";
