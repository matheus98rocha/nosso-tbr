import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/constants/keys";
import { useModal } from "@/hooks";
import { BookUpsertService } from "@/modules/bookUpsert/services/bookUpsert.service";
import { useReadingProgressMany } from "@/modules/schedule/hooks/useReadingProgressMany";
import { BookService } from "@/services/books/books.service";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useUserStore } from "@/stores/userStore";
import type { BookDomain, Status } from "@/types/books.types";
import type { FiltersOptions } from "@/types/filters";
import { buildHomeUrlWithStatusFilter } from "@/utils/buildHomeUrlWithStatusFilter";
import { isUnauthorizedError } from "@/lib/api/isUnauthorizedError";

import type {
  ReadingNowBookItem,
  ReadingNowStatusTransitionStatus,
  ReadingNowStatusTransitionTarget,
} from "../readingNow.types";
import { buildReadingNowStatusPayload } from "../utils/buildReadingNowStatusPayload";

const READING_NOW_PAGE_SIZE = 12;

const READING_NOW_FILTERS: FiltersOptions = {
  readers: [],
  status: ["reading"],
  gender: [],
  view: "todos",
  userId: "",
  bookId: "",
  authorId: "",
  year: undefined,
  myBooks: false,
  focusReaderId: "",
};

const bookService = new BookService();
const bookUpsertService = new BookUpsertService();

const STATUS_SUCCESS_LABEL: Record<"finished" | "paused" | "abandoned", string> = {
  finished: "Leitura finalizada",
  paused: "Leitura pausada",
  abandoned: "Leitura abandonada",
};

function computeDaysReading(startDate: string | null | undefined): number | null {
  if (!startDate) return null;

  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - start.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

  return days > 0 ? days : 1;
}

function toReadingNowItem(
  book: BookDomain,
  progressByBookId: Map<string, { bookId: string; total: number; completed: number; percentage: number }>,
): ReadingNowBookItem | null {
  if (!book.id) return null;

  return {
    book: book as BookDomain & { id: string },
    scheduleProgress: progressByBookId.get(book.id) ?? null,
    daysReading: computeDaysReading(book.start_date),
  };
}

export function useReadingNow() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const isLoggedIn = useIsLoggedIn();
  const userId = useUserStore((state) => state.user?.id);
  const detailsModal = useModal();
  const [detailsBook, setDetailsBook] = useState<(BookDomain & { id: string }) | null>(
    null,
  );
  const [ratingPromptBookId, setRatingPromptBookId] = useState<string | null>(null);
  const [transitioningBookId, setTransitioningBookId] = useState<string | null>(null);
  const [pendingStatusTransition, setPendingStatusTransition] =
    useState<ReadingNowStatusTransitionTarget | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { data, isLoading, isError, isFetched } = useQuery({
    queryKey: [...QUERY_KEYS.books.all, "reading-now", userId] as const,
    queryFn: () =>
      bookService.getAll({
        userId,
        filters: READING_NOW_FILTERS,
        page: 0,
        pageSize: READING_NOW_PAGE_SIZE,
      }),
    enabled: isLoggedIn && !!userId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: false,
  });

  const readingBooks = useMemo(
    () =>
      (data?.data ?? []).filter(
        (book): book is BookDomain & { id: string } => typeof book.id === "string",
      ),
    [data?.data],
  );

  const readingBookIds = useMemo(
    () => readingBooks.map((book) => book.id),
    [readingBooks],
  );

  const {
    progressByBookId,
    isLoading: isProgressLoading,
    isError: isProgressError,
  } = useReadingProgressMany(readingBookIds);

  const items = useMemo(
    () =>
      readingBooks
        .map((book) => toReadingNowItem(book, progressByBookId))
        .filter((item): item is ReadingNowBookItem => item !== null),
    [readingBooks, progressByBookId],
  );

  const hasMultipleBooks = items.length > 1;
  const activeItem = items[activeIndex] ?? null;
  const activeBookTitle = activeItem?.book.title ?? null;
  const shouldRender =
    isLoggedIn && (isLoading || items.length > 0 || isError);

  useEffect(() => {
    if (activeIndex >= items.length && items.length > 0) {
      setActiveIndex(0);
    }
  }, [activeIndex, items.length]);

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;

    const slide = container.children[index] as HTMLElement | undefined;
    if (!slide) return;

    slide.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
  }, []);

  const goToIndex = useCallback(
    (index: number) => {
      if (items.length === 0) return;

      const nextIndex = Math.max(0, Math.min(index, items.length - 1));
      setActiveIndex(nextIndex);
      scrollToIndex(nextIndex);
    },
    [items.length, scrollToIndex],
  );

  const goToNext = useCallback(() => {
    goToIndex(activeIndex + 1);
  }, [activeIndex, goToIndex]);

  const goToPrevious = useCallback(() => {
    goToIndex(activeIndex - 1);
  }, [activeIndex, goToIndex]);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container || items.length <= 1) return;

    const { scrollLeft, clientWidth } = container;
    if (clientWidth <= 0) return;

    const nextIndex = Math.round(scrollLeft / clientWidth);
    setActiveIndex((previous) =>
      previous === nextIndex ? previous : nextIndex,
    );
  }, [items.length]);

  const buildScheduleHref = useCallback(
    (bookId: string, title: string) => `/schedule/${bookId}/${title}`,
    [],
  );

  const buildQuotesHref = useCallback(
    (bookId: string, title: string) => `/quotes/${title}/${bookId}`,
    [],
  );

  const navigateToSchedule = useCallback(
    (bookId: string, title: string) => {
      router.push(buildScheduleHref(bookId, title));
    },
    [router, buildScheduleHref],
  );

  const navigateToQuotes = useCallback(
    (bookId: string, title: string) => {
      router.push(buildQuotesHref(bookId, title));
    },
    [router, buildQuotesHref],
  );

  const activeScheduleHref = useMemo(() => {
    if (!activeItem) return null;
    return buildScheduleHref(activeItem.book.id, activeItem.book.title);
  }, [activeItem, buildScheduleHref]);

  const openBookDetails = useCallback(
    (book: BookDomain & { id: string }) => {
      setDetailsBook(book);
      detailsModal.setIsOpen(true);
    },
    [detailsModal],
  );

  const handleDetailsOpenChange = useCallback(
    (open: boolean) => {
      detailsModal.setIsOpen(open);
      if (!open) {
        setDetailsBook(null);
      }
    },
    [detailsModal],
  );

  const dismissRatingPrompt = useCallback(() => {
    setRatingPromptBookId(null);
  }, []);

  const statusTransitionMutation = useMutation({
    mutationFn: async ({
      book,
      nextStatus,
    }: {
      book: BookDomain & { id: string };
      nextStatus: Status;
    }) => {
      setTransitioningBookId(book.id);
      const payload = buildReadingNowStatusPayload(book, nextStatus);
      await bookUpsertService.edit(book.id, payload);
      return { bookId: book.id, nextStatus };
    },
    onSuccess: async ({ bookId, nextStatus }) => {
      toast(STATUS_SUCCESS_LABEL[nextStatus as keyof typeof STATUS_SUCCESS_LABEL]);

      await queryClient.invalidateQueries({
        queryKey: ["books"],
        exact: false,
      });

      if (pathname === "/") {
        router.replace(
          buildHomeUrlWithStatusFilter(
            new URLSearchParams(searchParams.toString()),
            nextStatus,
          ),
        );
      }

      if (nextStatus === "finished") {
        setRatingPromptBookId(bookId);
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast("Sessão expirada", {
          description: "Faça login novamente para continuar.",
          className: "toast-error",
        });
        router.push("/auth");
        return;
      }

      toast("Não foi possível atualizar o status", {
        description:
          error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
        className: "toast-error",
      });
    },
    onSettled: () => {
      setTransitioningBookId(null);
    },
  });

  const changeBookStatus = useCallback(
    (book: BookDomain & { id: string }, nextStatus: Status) => {
      statusTransitionMutation.mutate({ book, nextStatus });
    },
    [statusTransitionMutation],
  );

  const finishReading = useCallback(
    (book: BookDomain & { id: string }) => {
      changeBookStatus(book, "finished");
    },
    [changeBookStatus],
  );

  const pauseReading = useCallback(
    (book: BookDomain & { id: string }) => {
      changeBookStatus(book, "paused");
    },
    [changeBookStatus],
  );

  const abandonReading = useCallback(
    (book: BookDomain & { id: string }) => {
      changeBookStatus(book, "abandoned");
    },
    [changeBookStatus],
  );

  const requestStatusTransition = useCallback(
    (book: BookDomain & { id: string }, nextStatus: ReadingNowStatusTransitionStatus) => {
      setPendingStatusTransition({ book, nextStatus });
    },
    [],
  );

  const cancelStatusTransition = useCallback(() => {
    setPendingStatusTransition(null);
  }, []);

  const confirmStatusTransition = useCallback(() => {
    if (!pendingStatusTransition) return;

    const { book, nextStatus } = pendingStatusTransition;
    changeBookStatus(book, nextStatus);
    setPendingStatusTransition(null);

    if (detailsBook?.id === book.id) {
      handleDetailsOpenChange(false);
    }
  }, [
    pendingStatusTransition,
    changeBookStatus,
    detailsBook?.id,
    handleDetailsOpenChange,
  ]);

  const isStatusPending = statusTransitionMutation.isPending;

  return {
    scrollRef,
    items,
    activeIndex,
    activeItem,
    activeBookTitle,
    hasMultipleBooks,
    shouldRender,
    isLoading,
    isFetched,
    isError,
    isProgressLoading,
    isProgressError,
    goToIndex,
    goToNext,
    goToPrevious,
    handleScroll,
    navigateToSchedule,
    navigateToQuotes,
    activeScheduleHref,
    canGoPrevious: activeIndex > 0,
    canGoNext: activeIndex < items.length - 1,
    detailsBook,
    detailsModalOpen: detailsModal.isOpen,
    openBookDetails,
    handleDetailsOpenChange,
    finishReading,
    pauseReading,
    abandonReading,
    pendingStatusTransition,
    requestStatusTransition,
    cancelStatusTransition,
    confirmStatusTransition,
    isStatusPending,
    transitioningBookId,
    ratingPromptBookId,
    dismissRatingPrompt,
  };
}
