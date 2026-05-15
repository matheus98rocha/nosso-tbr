import type {
  BookSuggestion,
  RecommendationOption,
  RecommendationResponse,
  RecommendationType,
} from "./recommendation.types";

export interface AiRecommendationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPickSuggestion: (suggestion: BookSuggestion) => void;
}

export interface AiRecommendationOptionListProps {
  options: RecommendationOption[];
  selectedType: RecommendationType | null;
  isLoading: boolean;
  onSelect: (type: RecommendationType) => void;
}

export interface AiSuggestionCardProps {
  suggestion: BookSuggestion;
  onAdd: (suggestion: BookSuggestion) => void;
}

export interface AiSuggestionsListProps {
  data: RecommendationResponse;
  onPickSuggestion: (suggestion: BookSuggestion) => void;
  onTryAnother: () => void;
}

export interface AiRecommendationFabProps {
  onClick: () => void;
}
