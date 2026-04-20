import { BookCandidate } from "../../types/bookCandidate.types";

export interface BookLookupPanelProps {
  candidates: BookCandidate[];
  isSearching: boolean;
  hasSearched: boolean;
  lookupQuery: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  onSelect: (candidate: BookCandidate) => void;
}
