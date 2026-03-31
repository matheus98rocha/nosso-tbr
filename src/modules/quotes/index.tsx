"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuotes } from "./hooks/useQuotes";
import { X } from "lucide-react";
import { UpsertQuoteModal } from "./components/UpsertQuoteModal";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientQuotesProps } from "./types/quotes.types";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components";

export function ClientQuotes({ id, title }: ClientQuotesProps) {
  const {
    quotes,
    isLoading,
    hasQuotes,
    deleteId,
    deleteMutation,
    deleteOpen,
    handleOpenDelete,
    setDeleteOpen,
  } = useQuotes({ id, title });

  if (isLoading) {
    return (
      <div className="space-y-4 w-full container animate-pulse">
        <Skeleton className="h-12 w-48 rounded" />
        <Skeleton className="h-12 w-48 rounded" />
        <div className="space-y-4 mt-4">
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full container">
      <UpsertQuoteModal id={id} title={title} />

      <Separator orientation="horizontal" className="mt-4 mb-4" />
      <h2 className="text-xl font-bold mb-4">📚 {title}</h2>

      {deleteId && (
        <ConfirmDialog
          title="Remover Citação"
          description="Tem certeza que deseja remover esta citação?"
          id={deleteId}
          queryKeyToInvalidate="quotes"
          onConfirm={async () => await deleteMutation.mutateAsync(deleteId)}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          buttonLabel={deleteMutation.isPending ? "Removendo..." : "Deletar"}
        />
      )}
      {hasQuotes ? (
        quotes?.map((quote) => (
          <Card key={quote.id} className="relative w-full group">
            <CardHeader className="flex justify-between items-start">
              <CardTitle>Página {quote.page ?? "N/A"}</CardTitle>
              <div className="flex items-center gap-2">
                <UpsertQuoteModal id={id} title={title} quote={quote} />

                {/* Botão deletar */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-black transition-transform transform hover:scale-110"
                  aria-label="Editar citação"
                  onClick={() => handleOpenDelete(quote.id)}
                >
                  {deleteMutation.isPending && deleteId === quote.id ? (
                    "..."
                  ) : (
                    <X
                      size={20}
                      className="text-black  transition-transform transform hover:scale-110"
                    />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{quote.content}</CardDescription>
            </CardContent>
          </Card>
        ))
      ) : (
        <div>Você ainda não adicionou nenhuma citação.</div>
      )}
    </div>
  );
}

export default ClientQuotes;
