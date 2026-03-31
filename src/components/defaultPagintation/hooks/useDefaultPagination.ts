import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";
import type {
  DefaultPaginationProps,
  PaginationViewToken,
} from "../types/defaultPagination.types";

type PaginationAlgorithmToken =
  | { type: "page"; page: number }
  | { type: "ellipsis"; key: string };

const SHOW_ALL_PAGE_THRESHOLD = 7;

const interactiveNavSurfaceClass =
  "cursor-pointer rounded-md transition-colors duration-200 motion-reduce:transition-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-background active:opacity-80 motion-reduce:active:opacity-100 min-h-11";

function range(start: number, end: number): number[] {
  if (start > end) return [];
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function buildPaginationTokens(
  totalPages: number,
  currentPage: number,
  siblingCount: number,
  boundaryCount = 1,
): PaginationAlgorithmToken[] {
  const count = totalPages;
  const page = currentPage + 1;

  if (count <= SHOW_ALL_PAGE_THRESHOLD) {
    return Array.from({ length: count }, (_, i) => ({
      type: "page" as const,
      page: i,
    }));
  }

  const startPages = range(1, Math.min(boundaryCount, count));
  const endPages = range(
    Math.max(count - boundaryCount + 1, boundaryCount + 1),
    count,
  );

  const siblingsStart = Math.max(
    Math.min(page - siblingCount, count - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2,
  );

  const siblingsEnd = Math.min(
    Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length > 0 ? endPages[0] - 2 : count - 1,
  );

  const rawItems: Array<number | "start-ellipsis" | "end-ellipsis"> = [
    ...startPages,
    ...(siblingsStart > boundaryCount + 2
      ? ["start-ellipsis" as const]
      : boundaryCount + 1 < count - boundaryCount
        ? [boundaryCount + 1]
        : []),
    ...range(siblingsStart, siblingsEnd),
    ...(siblingsEnd < count - boundaryCount - 1
      ? ["end-ellipsis" as const]
      : count - boundaryCount > boundaryCount
        ? [count - boundaryCount]
        : []),
    ...endPages,
  ];

  return rawItems.map((item) =>
    typeof item === "number"
      ? { type: "page" as const, page: item - 1 }
      : { type: "ellipsis" as const, key: item },
  );
}

function usePaginationSiblingCount(): number {
  const [siblings, setSiblings] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const apply = () => setSiblings(mq.matches ? 1 : 0);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return siblings;
}

function useScrollActivePageIntoView(currentPage: number) {
  useEffect(() => {
    const active = document.getElementById(`pagination-page-${currentPage}`);
    if (!active) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    active.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [currentPage]);
}

export function useDefaultPagination({
  currentPage,
  totalPages,
  setCurrentPage,
  prevText = "Anterior",
  nextText = "Próximo",
}: DefaultPaginationProps) {
  const siblingCount = usePaginationSiblingCount();

  useScrollActivePageIntoView(currentPage);

  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;

  const handlePreviousClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      if (!isFirstPage) setCurrentPage((prev) => prev - 1);
    },
    [isFirstPage, setCurrentPage],
  );

  const handleNextClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      if (!isLastPage) setCurrentPage((prev) => prev + 1);
    },
    [isLastPage, setCurrentPage],
  );

  const tokens = useMemo((): PaginationViewToken[] => {
    const built = buildPaginationTokens(totalPages, currentPage, siblingCount);
    return built.map((token) => {
      if (token.type === "ellipsis") {
        return token;
      }
      return {
        type: "page",
        page: token.page,
        onClick: (e) => {
          e.preventDefault();
          setCurrentPage(token.page);
        },
      };
    });
  }, [totalPages, currentPage, siblingCount, setCurrentPage]);

  const previousNavClassName = useMemo(
    () =>
      isFirstPage
        ? "pointer-events-none min-h-11 opacity-50"
        : interactiveNavSurfaceClass,
    [isFirstPage],
  );

  const nextNavClassName = useMemo(
    () =>
      isLastPage
        ? "pointer-events-none min-h-11 opacity-50"
        : interactiveNavSurfaceClass,
    [isLastPage],
  );

  const shouldRender = totalPages > 1;

  return useMemo(
    () => ({
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
    }),
    [
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
    ],
  );
}
