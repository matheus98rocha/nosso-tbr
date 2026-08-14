import type { Dispatch, MouseEvent, SetStateAction } from "react";

export type DefaultPaginationProps = {
  currentPage: number;
  totalPages: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  prevText?: string;
  nextText?: string;
};

export type PaginationEllipsisToken = {
  type: "ellipsis";
  key: string;
};

export type PaginationPageToken = {
  type: "page";
  page: number;
  onClick: (e: MouseEvent<HTMLAnchorElement>) => void;
};

export type PaginationViewToken = PaginationEllipsisToken | PaginationPageToken;
