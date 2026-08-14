import { Status } from "@/types/books.types";

export const ALL_BOOK_STATUSES: Status[] = [
  "reading",
  "finished",
  "not_started",
  "planned",
  "paused",
  "abandoned",
];

export const LOCKED_BOOK_STATUSES: Status[] = ["paused", "abandoned"];

export const NON_CREATABLE_BOOK_STATUSES: Status[] = [...LOCKED_BOOK_STATUSES];
