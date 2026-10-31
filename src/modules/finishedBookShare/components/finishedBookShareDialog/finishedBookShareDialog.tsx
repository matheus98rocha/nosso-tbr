"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { FINISHED_BOOK_SHARE_COPY } from "../../constants";
import { useFinishedBookShareDialog } from "../../hooks";
import type { FinishedBookShareDialogProps } from "../../types";

export function FinishedBookShareDialog({
  subject,
  open,
  onClose,
}: FinishedBookShareDialogProps) {
  const share = useFinishedBookShareDialog(subject);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        aria-busy={share.phase === "loading"}
        className="max-h-[90dvh] gap-4 overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>{FINISHED_BOOK_SHARE_COPY.dialogTitle}</DialogTitle>
          {share.phase === "loading" ? (
            <DialogDescription>{FINISHED_BOOK_SHARE_COPY.generating}</DialogDescription>
          ) : null}
          {share.phase === "ready" ? (
            <DialogDescription>
              {FINISHED_BOOK_SHARE_COPY.manualAttach}
            </DialogDescription>
          ) : null}
          {share.phase === "error" ? (
            <DialogDescription>{FINISHED_BOOK_SHARE_COPY.generateError}</DialogDescription>
          ) : null}
        </DialogHeader>

        {share.phase === "ready" && share.objectUrl ? (
          <img
            src={share.objectUrl}
            alt={share.model.alt}
            className="h-auto w-full rounded-md"
          />
        ) : null}

        {share.phase === "error" ? (
          <Button type="button" variant="outline" onClick={share.retry}>
            {FINISHED_BOOK_SHARE_COPY.retry}
          </Button>
        ) : null}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            className="w-full"
            disabled={share.actionsDisabled}
            onClick={share.download}
          >
            {FINISHED_BOOK_SHARE_COPY.download}
          </Button>
          <Button
            type="button"
            className="w-full"
            disabled={share.actionsDisabled}
            onClick={() => {
              void share.copyText();
            }}
          >
            {FINISHED_BOOK_SHARE_COPY.copyText}
          </Button>
          <Button
            type="button"
            className="w-full"
            disabled={share.actionsDisabled}
            onClick={share.openOnX}
          >
            {FINISHED_BOOK_SHARE_COPY.openOnX}
          </Button>
          <Button type="button" className="w-full" variant="outline" onClick={onClose}>
            {FINISHED_BOOK_SHARE_COPY.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
