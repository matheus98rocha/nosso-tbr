"use client";

import React, { useState } from "react";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QuotesService } from "./services/quotes.service";

type ClientQuotesProps = {
  id: string;
};

export function ClientQuotes({ id }: ClientQuotesProps) {
  const { quotes, isLoading, hasQuotes } = useQuotes({ bookId: id });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const queryClient = useQueryClient();

  // Mutation de remoção
  const deleteMutation = useMutation({
    mutationFn: (quoteId: string) => {
      const quotesService = new QuotesService();
      return quotesService.removeQuote(quoteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes", id] });
      setDeleteOpen(false);
      setDeleteId(null);
    },
  });

  const handleOpenDelete = (quoteId: string) => {
    setDeleteId(quoteId);
    setDeleteOpen(true);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4 w-full container">
      <CreateQuoteModal bookId={id} />

      {quotes && quotes.length > 0 && (
        <h2 className="text-xl font-bold mb-4">
          📚 {quotes[0].bookTitle ?? "Título do Livro"}
        </h2>
      )}

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
