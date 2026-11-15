"use client";

import { memo } from "react";

import { ConfirmDialog } from "@/components";
import { Button } from "@/components/ui/button";

import type { DeleteAccountSectionProps } from "./types/deleteAccountSection.types";

function DeleteAccountSection({
  description,
  isConfirmOpen,
  userId,
  onOpenConfirm,
  onCloseConfirm,
  onConfirmOpenChange,
  onConfirm,
}: DeleteAccountSectionProps) {
  return (
    <section
      className="overflow-hidden rounded-2xl border border-rose-200/80 shadow-md dark:border-rose-900/50 dark:bg-zinc-900/50"
      aria-labelledby="delete-account-heading"
    >
      <div className="space-y-4 p-4 sm:p-6">
        <div className="space-y-1">
          <h2
            id="delete-account-heading"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
          >
            Excluir conta
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        </div>
        <Button
          type="button"
          variant="destructive"
          className="h-11 rounded-xl"
          onClick={onOpenConfirm}
        >
          Excluir minha conta
        </Button>
      </div>
      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={onConfirmOpenChange}
        id={userId}
        onConfirm={onConfirm}
        onCancel={onCloseConfirm}
        queryKeyToInvalidate="account"
        title="Excluir conta"
        buttonLabel="Excluir conta"
        description={description}
      />
    </section>
  );
}

export default memo(DeleteAccountSection);
