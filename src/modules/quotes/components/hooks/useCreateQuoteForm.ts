import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QuotesService } from "@/modules/quotes/services/quotes.service";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateQuoteFormInput,
  createQuoteSchema,
} from "../../validators/quotes.validator";
import { UseCreateQuoteFormProps } from "../../types/quotes.types";

export function useCreateQuoteForm({
  bookId,
  onSuccessCloseModal,
}: UseCreateQuoteFormProps) {
  const quotesService = new QuotesService();
  const queryClient = useQueryClient();

  const form = useForm<CreateQuoteFormInput>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: {
      content: "",
      page: undefined,
    },
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = form;

  const createQuoteMutation = useMutation({
    mutationFn: (data: CreateQuoteFormInput) =>
      quotesService.createQuote(bookId, data.content, data.page),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes", bookId] });
      reset({ content: "", page: undefined });
      onSuccessCloseModal?.();
    },
    onError: (error) => {
      console.error("Erro ao criar citação:", error);
    },
  });

  const onSubmit: SubmitHandler<CreateQuoteFormInput> = async (data) => {
    await createQuoteMutation.mutateAsync(data);
  };

  return {
    form,
    register,
    control,
    handleSubmit,
    errors,
    isSubmitting,
    onSubmit,
  };
}
