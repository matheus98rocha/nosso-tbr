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
};
