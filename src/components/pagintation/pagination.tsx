import React, { Dispatch, SetStateAction } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";

type DefaultPaginationProps = {
  currentPage: number;
  totalPages: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  prevText?: string;
  nextText?: string;
};

function DefaultPagination({
  currentPage,
  totalPages,
  setCurrentPage,
  prevText = "Anterior",
  nextText = "Próximo",
}: DefaultPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage > 0) setCurrentPage((prev) => prev - 1);
            }}
            className={
              currentPage === 0
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          >
            {prevText}
          </PaginationPrevious>
        </PaginationItem>

        {Array.from({ length: totalPages }).map((_, idx) => (
          <PaginationItem key={idx}>
            <PaginationLink
              href="#"
              isActive={currentPage === idx}
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage(idx);
              }}
            >
              {idx + 1}
            </PaginationLink>
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage < totalPages - 1)
                setCurrentPage((prev) => prev + 1);
            }}
            className={
              currentPage === totalPages - 1
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          >
            {nextText}
          </PaginationNext>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export default DefaultPagination;
