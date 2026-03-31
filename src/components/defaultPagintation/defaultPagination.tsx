import React, { memo } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import { useDefaultPagination } from "./hooks/useDefaultPagination";
import type { DefaultPaginationProps } from "./types/defaultPagination.types";

const interactiveSurface =
  "cursor-pointer rounded-md transition-colors duration-200 motion-reduce:transition-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-background active:opacity-80 motion-reduce:active:opacity-100";

const pageLinkClass = `${interactiveSurface} min-h-11 min-w-11 touch-manipulation select-none`;

function DefaultPaginationComponent(props: DefaultPaginationProps) {
  const {
    shouldRender,
    tokens,
    currentPage,
    isFirstPage,
    isLastPage,
    prevText,
    nextText,
    previousNavClassName,
    nextNavClassName,
    handlePreviousClick,
    handleNextClick,
  } = useDefaultPagination(props);

  if (!shouldRender) return null;

  return (
    <Pagination className="mt-4 w-full min-w-0 max-w-full px-2 sm:px-4">
      <PaginationContent className="w-full max-w-full flex-nowrap items-stretch gap-1 sm:gap-2 sm:justify-center">
        <PaginationItem className="flex shrink-0 items-center">
          <PaginationPrevious
            href="#"
            aria-disabled={isFirstPage}
            tabIndex={isFirstPage ? -1 : undefined}
            onClick={handlePreviousClick}
            className={previousNavClassName}
          >
            {prevText}
          </PaginationPrevious>
        </PaginationItem>

        <PaginationItem className="flex min-h-11 min-w-0 flex-1 items-center justify-center sm:flex-none">
          <div className="flex max-h-11 min-h-11 w-full min-w-0 flex-1 touch-pan-x overflow-x-auto overscroll-x-contain scroll-smooth motion-reduce:scroll-auto [-ms-overflow-style:none] [scrollbar-gutter:stable] [scrollbar-width:thin] sm:flex-none sm:max-h-none sm:overflow-visible [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:max-md:h-0 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent">
            <ul
              aria-label="Page numbers"
              className="mx-auto flex max-w-max min-w-0 flex-nowrap items-center justify-center gap-0.5 px-1 sm:gap-1 md:gap-1.5"
            >
              {tokens.map((token) =>
                token.type === "ellipsis" ? (
                  <li key={token.key} data-slot="pagination-item">
                    <PaginationEllipsis className="min-h-11 min-w-11 shrink-0" />
                  </li>
                ) : (
                  <li key={`page-${token.page}`} data-slot="pagination-item">
                    <PaginationLink
                      id={`pagination-page-${token.page}`}
                      href="#"
                      isActive={currentPage === token.page}
                      onClick={token.onClick}
                      className={pageLinkClass}
                      aria-label={`Go to page ${token.page + 1}`}
                    >
                      {token.page + 1}
                    </PaginationLink>
                  </li>
                ),
              )}
            </ul>
          </div>
        </PaginationItem>

        <PaginationItem className="flex shrink-0 items-center">
          <PaginationNext
            href="#"
            aria-disabled={isLastPage}
            tabIndex={isLastPage ? -1 : undefined}
            onClick={handleNextClick}
            className={nextNavClassName}
          >
            {nextText}
          </PaginationNext>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

const DefaultPagination = memo(DefaultPaginationComponent);

export default DefaultPagination;
