"use client";

import { Sparkles } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useAiRecommendationDialog, useRecommendationOptions } from "../../hooks";
import type { AiRecommendationDialogProps } from "../../types";
import AiRecommendationLoader from "../aiRecommendationLoader";
import AiRecommendationOptionList from "../aiRecommendationOptionList";
import AiSuggestionsList from "../aiSuggestionsList";

function AiRecommendationDialog({
  isOpen,
  onOpenChange,
  onPickSuggestion,
}: AiRecommendationDialogProps) {
  const options = useRecommendationOptions();
  const {
    data,
    selectedType,
    isLoading,
    handleSelectType,
    handleTryAnother,
    handlePickSuggestion,
    handleOpenChange,
  } = useAiRecommendationDialog({ isOpen, onOpenChange, onPickSuggestion });

  const showResult = !isLoading && !!data;
  const showLoader = isLoading;
  const showOptions = !isLoading && !data;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-lg max-h-[90dvh] overflow-y-auto"
        aria-describedby="ai-recommendation-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 via-fuchsia-500 to-amber-400 text-white"
              aria-hidden
            >
              <Sparkles className="size-4" />
            </span>
            Indicação de leitura
          </DialogTitle>
          <DialogDescription id="ai-recommendation-description">
            Escolha em que perfil você quer basear a recomendação. A IA usa o
            seu histórico real do app e nunca sugere livros que já estão na sua
            estante.
          </DialogDescription>
        </DialogHeader>

        {showOptions && (
          <AiRecommendationOptionList
            options={options}
            selectedType={selectedType}
            isLoading={isLoading}
            onSelect={handleSelectType}
          />
        )}

        {showLoader && <AiRecommendationLoader />}

        {showResult && data && (
          <AiSuggestionsList
            data={data}
            onPickSuggestion={handlePickSuggestion}
            onTryAnother={handleTryAnother}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AiRecommendationDialog;
