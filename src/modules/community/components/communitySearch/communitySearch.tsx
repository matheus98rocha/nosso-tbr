"use client";

import { memo } from "react";

import { InputWithButton } from "@/components/inputWithButton";

import { useCommunitySearch } from "./hooks/useCommunitySearch";
import type { CommunitySearchProps } from "./types/communitySearch.types";

function CommunitySearchComponent({
  inputValue,
  suggestions,
  isLoadingSuggestions,
  shouldSearchSuggestions,
  onInputChange,
  onSubmit,
  onSelectSuggestion,
}: CommunitySearchProps) {
  const {
    containerRef,
    showAutocomplete,
    hasResults,
    handleFocusInput,
    handleSubmit,
    handleKeyDown,
    handleSelectSuggestion,
  } = useCommunitySearch({
    suggestions,
    shouldSearchSuggestions,
    onSubmit,
    onSelectSuggestion,
  });

  return (
    <div className="relative w-full lg:w-80" ref={containerRef}>
      <InputWithButton
        value={inputValue}
        onChange={onInputChange}
        onFocus={handleFocusInput}
        onButtonClick={handleSubmit}
        onKeyDown={handleKeyDown}
        buttonLabel="Buscar leitores"
        placeholder="Buscar por nome..."
      />
      {showAutocomplete ? (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          {isLoadingSuggestions ? (
            <p className="px-3 py-2 text-sm text-zinc-500">Buscando...</p>
          ) : hasResults ? (
            <ul className="max-h-80 overflow-y-auto py-1" aria-label="Sugestões de leitores">
              {suggestions.map((suggestion) => (
                <li key={suggestion.id}>
                  <button
                    type="button"
                    className="min-h-11 w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    {suggestion.displayName}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-2 text-sm text-zinc-500">
              Nenhum leitor encontrado
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default memo(CommunitySearchComponent);
