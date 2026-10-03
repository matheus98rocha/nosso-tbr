"use client";

import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import type { AddBookReaderDialogProps } from "../../types/addBookReader.types";

export default function AddBookReaderDialog({
  open,
  bookTitle,
  term,
  candidates,
  isSearching,
  shouldSearch,
  pendingUserId,
  onOpenChange,
  onTermChange,
  onSelect,
}: AddBookReaderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar novo leitor</DialogTitle>
          <DialogDescription>
            Convide alguém que você segue para a leitura de “{bookTitle}”.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <label htmlFor="add-reader-search" className="sr-only">
            Nome ou e-mail de quem você segue
          </label>
          <Input
            id="add-reader-search"
            value={term}
            autoFocus
            placeholder="Nome ou e-mail de quem você segue"
            onChange={(event) => onTermChange(event.target.value)}
          />

          {shouldSearch ? null : (
            <p className="text-sm text-muted-foreground">
              Digite o nome ou o e-mail de uma pessoa que você segue.
            </p>
          )}

          {isSearching ? (
            <p className="text-sm text-muted-foreground">Buscando...</p>
          ) : null}

          {shouldSearch && !isSearching && candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma pessoa que você segue com esse nome ou e-mail.
            </p>
          ) : null}

          {candidates.length > 0 ? (
            <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
              {candidates.map((candidate) => {
                const isPending = pendingUserId === candidate.id;

                return (
                  <li key={candidate.id}>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={pendingUserId !== null}
                      className="h-auto w-full justify-start gap-3 px-3 py-2"
                      onClick={() => onSelect(candidate)}
                    >
                      <UserPlus aria-hidden className="size-4 shrink-0" />
                      <span className="min-w-0 text-left">
                        <span className="block truncate text-sm font-medium">
                          {isPending
                            ? "Adicionando..."
                            : candidate.displayName}
                        </span>
                        {candidate.email ? (
                          <span className="block truncate text-xs text-muted-foreground">
                            {candidate.email}
                          </span>
                        ) : null}
                      </span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
