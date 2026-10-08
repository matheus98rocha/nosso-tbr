import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import type { CommunityMemberSuggestion } from "../../../types/community.types";
import type { CommunitySearchProps } from "../types/communitySearch.types";

export function useCommunitySearch({
  suggestions,
  shouldSearchSuggestions,
  onSubmit,
  onSelectSuggestion,
}: Pick<
  CommunitySearchProps,
  "suggestions" | "shouldSearchSuggestions" | "onSubmit" | "onSelectSuggestion"
>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);

  const hasResults = useMemo(() => suggestions.length > 0, [suggestions.length]);

  const showAutocomplete = useMemo(
    () => isAutocompleteOpen && shouldSearchSuggestions,
    [isAutocompleteOpen, shouldSearchSuggestions],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsAutocompleteOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFocusInput = useCallback(() => {
    setIsAutocompleteOpen(true);
  }, []);

  const handleSubmit = useCallback(
    (value: string) => {
      onSubmit(value);
      setIsAutocompleteOpen(false);
    },
    [onSubmit],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();
      handleSubmit(event.currentTarget.value);
    },
    [handleSubmit],
  );

  const handleSelectSuggestion = useCallback(
    (suggestion: CommunityMemberSuggestion) => {
      onSelectSuggestion(suggestion);
      setIsAutocompleteOpen(false);
    },
    [onSelectSuggestion],
  );

  return {
    containerRef,
    showAutocomplete,
    hasResults,
    handleFocusInput,
    handleSubmit,
    handleKeyDown,
    handleSelectSuggestion,
  };
}
