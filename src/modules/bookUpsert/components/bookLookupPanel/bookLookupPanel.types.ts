import { BookLookupData } from "../../types/bookLookup.types";

export interface BookLookupPanelProps {
  isSearching: boolean;
  error: string | null;
  foundBook: BookLookupData | null;
  lookupQuery: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
}
