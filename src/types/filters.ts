export type SortOption =
  | "pages_asc"
  | "pages_desc"
  | "start_date_asc"
  | "start_date_desc"
  | "end_date_asc"
  | "end_date_desc";

export type FiltersOptions = {
  readers: string[];
  status: string[];
  gender: string[];
  view: "todos" | "joint";
  userId?: string;
  bookId?: string;
  authorId?: string;
  year?: number;
  myBooks?: boolean;
  isReread?: boolean;
  sort?: SortOption;
};
