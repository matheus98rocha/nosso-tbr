import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QuotesService } from "../services/quotes.service";
import { useState } from "react";
import { ClientQuotesProps, QuoteDomain } from "../types/quotes.types";

export function useQuotes({ id: bookId }: ClientQuotesProps) {
  const queryClient = useQueryClient();
  const quotesService = new QuotesService();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleOpenDelete = (quoteId: string) => {
    setDeleteId(quoteId);
    setDeleteOpen(true);
  };

  const { data: quotes, isLoading: isLoadingQuotes } = useQuery({
    queryKey: ["quotes", bookId],
    queryFn: () => quotesService.getQuotesByBook(bookId),
  });

  // Mutação para remover citação
  const deleteMutation = useMutation({
    mutationFn: (quoteId: string) => {
      const quotesService = new QuotesService();
      return quotesService.removeQuote(quoteId);
    },
    onSuccess: (_, quoteId) => {
      queryClient.setQueryData<QuoteDomain[]>(
        ["quotes", bookId],
        (old) => old?.filter((quote) => quote.id !== quoteId) || []
      );
      setDeleteOpen(false);
      setDeleteId(null);
    },
  });

  const isLoading = isLoadingQuotes || deleteMutation.isPending;
  const hasQuotes = quotes && quotes.length > 0;

  return {
    quotes,
    isLoading,
    hasQuotes,
    deleteId,
    setDeleteId,
    deleteOpen,
    setDeleteOpen,
    handleOpenDelete,
    deleteMutation,
  };
}
