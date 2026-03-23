import {
  SearchAutocompleteDomain,
  SearchAutocompletePersistence,
} from "../../types/searchAutocomplete.types";

function calculateRelevance(term: string, label: string): number {
  const normalizedTerm = term.trim().toLowerCase();
  const normalizedLabel = label.trim().toLowerCase();

  if (!normalizedTerm || !normalizedLabel) return 0;
  if (normalizedLabel.startsWith(normalizedTerm)) return 2;
  if (normalizedLabel.includes(normalizedTerm)) return 1;
  return 0;
}

export const SearchAutocompleteMapper = {
  toDomain(
    persistence: SearchAutocompletePersistence,
    term: string,
  ): SearchAutocompleteDomain {
    return {
      ...persistence,
      score: calculateRelevance(term, persistence.label),
    };
  },
};
