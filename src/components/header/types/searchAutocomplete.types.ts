export type SearchResultType = "book" | "author";

export interface SearchAutocompletePersistence {
  id: string;
  label: string;
  type: SearchResultType;
}

export interface SearchAutocompleteDomain extends SearchAutocompletePersistence {
  score: number;
}
