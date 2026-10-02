"use client";

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

import type { CommunityRemoveFollowerDialogProps } from "./types/communityRemoveFollowerDialog.types";

function CommunityRemoveFollowerDialogComponent({
  displayName,
  open,
  isPending,
  onOpenChange,
  onConfirm,
}: CommunityRemoveFollowerDialogProps) {
  const name = displayName?.trim() || "Essa pessoa";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="brand-display text-2xl font-semibold">
            Remover seguidor
          </DialogTitle>
          <DialogDescription>
            {name} deixa de te seguir. Leituras que só os seus seguidores veem
            deixam de aparecer para essa pessoa. Ela pode voltar a te seguir
            depois.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 cursor-pointer rounded-xl"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-11 cursor-pointer rounded-xl"
            isLoading={isPending}
            onClick={onConfirm}
          >
            Remover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default memo(CommunityRemoveFollowerDialogComponent);
