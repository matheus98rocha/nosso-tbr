import type { RefObject, KeyboardEvent } from "react";
import type { InputWithButtonRef } from "@/components/inputWithButton/inputWithButton";
import type { SearchAutocompleteDomain } from "@/components/header/types/searchAutocomplete.types";

export type SearchBarProps = {
  refInput: RefObject<InputWithButtonRef | null>;
  searchQuery: string;
  inputValue: string;
  onButtonClick?: (value: string) => void;
  onBlur?: (value: string) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  onChange?: (value: string) => void;
  onSelectSuggestion?: (result: SearchAutocompleteDomain) => void;
  groupedResults: {
    books: SearchAutocompleteDomain[];
    authors: SearchAutocompleteDomain[];
  };
  isLoadingSuggestions?: boolean;
  shouldSearch?: boolean;
};
