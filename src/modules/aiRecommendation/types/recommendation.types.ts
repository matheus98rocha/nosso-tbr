export type RecommendationType =
  | "books_this_year"
  | "books_last_year"
  | "top_genre"
  | "favorite_author"
  | "similar_to_last"
  | "surprise_me";

export interface BookSuggestion {
  title: string;
  author: string | null;
  reason: string | null;
}

export interface RecommendationRequest {
  user_id: string;
  type: RecommendationType;
}

export interface RecommendationResponse {
  message: string;
  suggestions: BookSuggestion[];
  type: RecommendationType;
}

export interface RecommendationOption {
  type: RecommendationType;
  label: string;
  description: string;
  icon: string;
}
