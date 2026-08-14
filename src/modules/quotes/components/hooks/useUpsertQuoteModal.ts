import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QuotesService } from "@/modules/quotes/services/quotes.service";

import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateQuoteFormInput,
  createQuoteSchema,
} from "../../validators/quotes.validator";
import { UseQuoteFormProps } from "../../types/quotes.types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { isUnauthorizedError } from "@/lib/api/isUnauthorizedError";

export function useUpsertQuoteModal({
  bookId,
  quote,
  onSuccessCloseModal,
}: UseQuoteFormProps) {
  const quotesService = new QuotesService();
  const queryClient = useQueryClient();
  const router = useRouter();

  const form = useForm<CreateQuoteFormInput>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: {
      content: quote?.content ?? "",
      page: quote?.page ?? undefined,
    },
  });

  const {
    register,
    watch,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = form;

  const createMutation = useMutation({
    mutationFn: (data: CreateQuoteFormInput) =>
      quotesService.createQuote(bookId, data.content, data.page ?? null),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateQuoteFormInput) =>
      quotesService.updateQuote(quote!.id, data.content, data.page),
  });

  const onSubmit: SubmitHandler<CreateQuoteFormInput> = async (data) => {
    const mutation = quote ? updateMutation : createMutation;

    await mutation.mutateAsync(data, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["quotes", bookId] });
        reset({ content: "", page: undefined });
        onSuccessCloseModal?.();
      },
      onError: (error) => {
        if (isUnauthorizedError(error)) {
          toast("Sessão expirada", {
            description: "Faça login novamente para continuar.",
            className: "toast-error",
          });
          router.push("/auth");
          return;
        }

        toast("Erro ao salvar citação", {
          description:
            error instanceof Error
              ? error.message
              : "Tente novamente em instantes.",
          className: "toast-error",
        });
      },
    });
  };

  return {
    register,
    control,
    handleSubmit,
    errors,
    isSubmitting,
    onSubmit,
    watch,
  };
}
