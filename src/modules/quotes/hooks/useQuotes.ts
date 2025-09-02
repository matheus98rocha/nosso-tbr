import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QuotesService } from "../services/quotes.service";
import { QuoteDomain } from "../types/quotes.types";

type UseQuotesProps = {
  bookId: string;
};

type AddQuoteInput = {
  content: string;
  page?: number;
};

export function useQuotes({ bookId }: UseQuotesProps) {
  const queryClient = useQueryClient();
  const quotesService = new QuotesService();

  // Fetch das citações
  const { data: quotes, isLoading: isLoadingQuotes } = useQuery({
    queryKey: ["quotes", bookId],
    queryFn: () => quotesService.getQuotesByBook(bookId),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Mutação para adicionar uma citação
  const { mutate: addQuote, isPending: isAdding } = useMutation({
    mutationFn: (quote: AddQuoteInput) =>
      quotesService.createQuote(bookId, quote.content, quote.page),

    onMutate: async (newQuote) => {
      await queryClient.cancelQueries({ queryKey: ["quotes", bookId] });

      const previousQuotes = queryClient.getQueryData<QuoteDomain[]>([
        "quotes",
        bookId,
      ]);

      const optimisticQuote: QuoteDomain = {
        id: "temp-id-" + Math.random().toString(36).substring(2),
        bookId,
        content: newQuote.content,
        page: newQuote.page ?? null,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<QuoteDomain[]>(["quotes", bookId], (old) =>
        old ? [...old, optimisticQuote] : [optimisticQuote]
      );

      return { previousQuotes };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousQuotes) {
        queryClient.setQueryData(["quotes", bookId], context.previousQuotes);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes", bookId] });
    },
  });

  // Mutação para remover citação
  const { mutate: removeQuote, isPending: isRemoving } = useMutation({
    mutationFn: (quoteId: string) => quotesService.removeQuote(quoteId),

    onMutate: async (quoteId) => {
      await queryClient.cancelQueries({ queryKey: ["quotes", bookId] });

      const previousQuotes = queryClient.getQueryData<QuoteDomain[]>([
        "quotes",
        bookId,
      ]);

      queryClient.setQueryData<QuoteDomain[]>(
        ["quotes", bookId],
        (old) => old?.filter((q) => q.id !== quoteId) ?? []
      );

      return { previousQuotes };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousQuotes) {
        queryClient.setQueryData(["quotes", bookId], context.previousQuotes);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes", bookId] });
    },
  });

  const isLoading = isLoadingQuotes || isAdding || isRemoving;
  const hasQuotes = quotes && quotes.length > 0;

  return {
    quotes,
    addQuote,
    removeQuote,
    isLoading,
    hasQuotes,
  };
}
