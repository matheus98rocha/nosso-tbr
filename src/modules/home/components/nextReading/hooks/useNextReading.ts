import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/constants/keys";
import { useModal } from "@/hooks";
import { isUnauthorizedError } from "@/lib/api/isUnauthorizedError";
import { BookUpsertService } from "@/modules/bookUpsert/services/bookUpsert.service";
import { BookService } from "@/services/books/books.service";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useUserStore } from "@/stores/userStore";
import type { BookDomain } from "@/types/books.types";
import type { FiltersOptions } from "@/types/filters";
import { buildHomeUrlWithStatusFilter } from "@/utils/buildHomeUrlWithStatusFilter";

import type { NextReadingItem } from "../nextReading.types";
import { buildNextReadingStartPayload } from "../utils/buildNextReadingStartPayload";
import { computeNextReadingDateMeta } from "../utils/computeNextReadingDateMeta";
import { selectNextReadingBook } from "../utils/selectNextReadingBook";

const NEXT_READING_PAGE_SIZE = 5;

const NEXT_READING_FILTERS: FiltersOptions = {
  readers: [],
  status: ["planned"],
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

export function useNextReading() {
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
  const [pendingStartBook, setPendingStartBook] = useState<
    (BookDomain & { id: string }) | null
  >(null);
  const [transitioningBookId, setTransitioningBookId] = useState<string | null>(null);

  const { data, isLoading, isError, isFetched } = useQuery({
    queryKey: [...QUERY_KEYS.books.all, "next-reading", userId] as const,
    queryFn: () =>
      bookService.getAll({
        userId,
        filters: NEXT_READING_FILTERS,
        page: 0,
        pageSize: NEXT_READING_PAGE_SIZE,
      }),
    enabled: isLoggedIn && !!userId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: false,
  });

  const item = useMemo((): NextReadingItem | null => {
    const selected = selectNextReadingBook(data?.data ?? []);
    if (!selected) {
      return null;
    }

    return {
      book: selected,
      dateMeta: computeNextReadingDateMeta(selected.planned_start_date),
    };
  }, [data?.data]);

  const shouldRender = isLoggedIn && (isLoading || !!item || isError);

  const buildScheduleHref = useCallback(
    (bookId: string, title: string) => `/schedule/${bookId}/${title}`,
    [],
  );

  const navigateToSchedule = useCallback(
    (bookId: string, title: string) => {
      router.push(buildScheduleHref(bookId, title));
    },
    [router, buildScheduleHref],
  );

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

  const startReadingMutation = useMutation({
    mutationFn: async (book: BookDomain & { id: string }) => {
      setTransitioningBookId(book.id);
      const payload = buildNextReadingStartPayload(book);
      await bookUpsertService.edit(book.id, payload);
      return book.id;
    },
    onSuccess: async () => {
      toast("Leitura iniciada");

      await queryClient.invalidateQueries({
        queryKey: ["books"],
        exact: false,
      });

      if (pathname === "/") {
        router.replace(
          buildHomeUrlWithStatusFilter(
            new URLSearchParams(searchParams.toString()),
            "reading",
          ),
        );
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

      toast("Não foi possível iniciar a leitura", {
        description:
          error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
        className: "toast-error",
      });
    },
    onSettled: () => {
      setTransitioningBookId(null);
    },
  });

  const requestStartReading = useCallback((book: BookDomain & { id: string }) => {
    setPendingStartBook(book);
  }, []);

  const cancelStartReading = useCallback(() => {
    setPendingStartBook(null);
  }, []);

  const confirmStartReading = useCallback(() => {
    if (!pendingStartBook) return;

    const book = pendingStartBook;
    startReadingMutation.mutate(book);
    setPendingStartBook(null);

    if (detailsBook?.id === book.id) {
      handleDetailsOpenChange(false);
    }
  }, [
    pendingStartBook,
    startReadingMutation,
    detailsBook?.id,
    handleDetailsOpenChange,
  ]);

  return {
    item,
    shouldRender,
    isLoading,
    isFetched,
    isError,
    detailsBook,
    detailsModalOpen: detailsModal.isOpen,
    openBookDetails,
    handleDetailsOpenChange,
    pendingStartBook,
    requestStartReading,
    cancelStartReading,
    confirmStartReading,
    navigateToSchedule,
    isStatusPending: startReadingMutation.isPending,
    transitioningBookId,
  };
}
