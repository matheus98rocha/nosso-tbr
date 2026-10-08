import type { CommunityMemberSuggestion } from "../../../types/community.types";

export type CommunitySearchProps = {
  inputValue: string;
  suggestions: CommunityMemberSuggestion[];
  isLoadingSuggestions: boolean;
  shouldSearchSuggestions: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onSelectSuggestion: (suggestion: CommunityMemberSuggestion) => void;
};
