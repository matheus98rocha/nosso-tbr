"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { useQuotes } from "./hooks/useQuotes";
import { X } from "lucide-react";
import { CreateQuoteModal } from "./components/createQuoteForm";
import { DeleteDialog } from "@/components/deleteModal/deleteModal";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientQuotesProps } from "./types/quotes.types";
import { Separator } from "@/components/ui/separator";

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
      <CreateQuoteModal id={id} title={title} />
      <Separator orientation="horizontal" className="mt-4 mb-4" />
      <h2 className="text-xl font-bold mb-4">📚 {title}</h2>

      {deleteId && (
        <DeleteDialog
          title="Remover Citação"
          description="Tem certeza que deseja remover esta citação?"
          id={deleteId}
          queryKeyToInvalidate="quotes"
          onDelete={async () => {
            await deleteMutation.mutateAsync(deleteId);
          }}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          buttomLabel={deleteMutation.isPending ? "Removendo..." : "Deletar"}
        />
      )}

      {hasQuotes ? (
        quotes?.map((quote) => (
          <Card key={quote.id} className="relative w-full">
            <CardHeader className="flex justify-between items-start">
              <CardTitle>Página {quote.page ?? "N/A"}</CardTitle>
              <button
                type="button"
                onClick={() => handleOpenDelete(quote.id)}
                className="text-red-500 hover:text-red-700 p-1 rounded"
                aria-label="Remover citação"
              >
                {deleteMutation.isPending && deleteId === quote.id ? (
                  "..."
                ) : (
                  <X size={20} />
                )}
              </button>
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
