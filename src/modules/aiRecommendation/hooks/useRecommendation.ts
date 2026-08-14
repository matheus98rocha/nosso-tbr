import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { useUserStore } from "@/stores/userStore";

import { fetchRecommendation } from "../services";
import type {
  RecommendationResponse,
  RecommendationType,
} from "../types/recommendation.types";

export function useRecommendation() {
  const user = useUserStore((state) => state.user);

  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [selectedType, setSelectedType] = useState<RecommendationType | null>(
    null,
  );

  const mutation = useMutation<
    RecommendationResponse,
    Error,
    RecommendationType
  >({
    mutationFn: async (type) => {
      if (!user?.id) {
        throw new Error("Você precisa estar logado para pedir uma indicação.");
      }
      return fetchRecommendation({ user_id: user.id, type });
    },
    onSuccess: (response) => {
      setData(response);
    },
    onError: (error) => {
      toast("Não foi possível gerar a indicação", {
        description:
          error instanceof Error
            ? error.message
            : "Tente novamente em instantes.",
        className: "toast-error",
      });
    },
  });

  const mutationRef = useRef(mutation);
  mutationRef.current = mutation;

  const generate = useCallback(async (type: RecommendationType) => {
    setSelectedType(type);
    setData(null);
    await mutationRef.current.mutateAsync(type).catch(() => {
      setSelectedType(null);
    });
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setSelectedType(null);
    mutationRef.current.reset();
  }, []);

  return {
    data,
    selectedType,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    generate,
    reset,
  };
}

export default useRecommendation;
