import { useCallback, useEffect } from "react";

import type {
  BookSuggestion,
  RecommendationType,
} from "../types/recommendation.types";
import { useRecommendation } from "./useRecommendation";

interface UseAiRecommendationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPickSuggestion: (suggestion: BookSuggestion) => void;
}

export function useAiRecommendationDialog({
  isOpen,
  onOpenChange,
  onPickSuggestion,
}: UseAiRecommendationDialogProps) {
  const { data, selectedType, isLoading, generate, reset } = useRecommendation();

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const handleSelectType = useCallback(
    (type: RecommendationType) => {
      if (isLoading) return;
      void generate(type);
    },
    [generate, isLoading],
  );

  const handleTryAnother = useCallback(() => {
    reset();
  }, [reset]);

  const handlePickSuggestion = useCallback(
    (suggestion: BookSuggestion) => {
      onPickSuggestion(suggestion);
      onOpenChange(false);
    },
    [onOpenChange, onPickSuggestion],
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      onOpenChange(open);
    },
    [onOpenChange],
  );

  return {
    data,
    selectedType,
    isLoading,
    handleSelectType,
    handleTryAnother,
    handlePickSuggestion,
    handleOpenChange,
  };
}

export default useAiRecommendationDialog;
