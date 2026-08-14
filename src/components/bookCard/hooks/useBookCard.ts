import { useModal, useSafeTap } from "@/hooks";
import { BookCardProps, StatusDisplay } from "../types/bookCard.types";
import { useRouter } from "next/navigation";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { MouseEvent } from "react";
import { canUserParticipateInBook } from "@/lib/security/bookParticipation";
import { BookshelfServiceBooks } from "@/modules/bookshelves/services/bookshelvesBooks.service";
import { BookService } from "@/services/books/books.service";
import { BookMapper } from "@/services/books/books.mapper";
import { useUserStore } from "@/stores/userStore";
import { useToggleBookFavorite } from "@/services/bookFavorites/hooks/useToggleBookFavorite";
import type { BookCreateValidator, Status } from "@/types/books.types";
import { BookUpsertService } from "@/modules/bookUpsert/services/bookUpsert.service";

export function useBookCard({
  book,
  isShelf = false,
  shelfId,
  hideInteractions = false,
}: BookCardProps) {
  const dropdownModal = useModal();
  const dialogEditModal = useModal();
  const dialogDeleteModal = useModal();
  const dialogAddShelfModal = useModal();
  const bookDetailsModal = useModal();

  const router = useRouter();
  const queryClient = useQueryClient();
  const isLogged = useIsLoggedIn();
  const currentUser = useUserStore((state) => state.user);
  const dropdownTap = useSafeTap(() => dropdownModal.setIsOpen(true));
  const { toggle: toggleFavorite, isPending: isFavoritePending } =
    useToggleBookFavorite();

  const isSoloBook = useMemo(() => BookMapper.isSoloBook(book), [book]);
  const isOwnSoloBook = useMemo(
    () => isSoloBook && !!currentUser?.id && book.chosen_by === currentUser.id,
    [isSoloBook, currentUser?.id, book.chosen_by],
  );

  const canAccessCollectiveReading = useMemo(() => {
    if (!isLogged || !BookMapper.isCollectiveReadingBook(book)) return false;
    if (!currentUser?.id) return false;
    return canUserParticipateInBook(currentUser.id, {
      user_id: book.user_id,
      chosen_by: book.chosen_by,
      readers: book.readerIds,
    });
  }, [book, currentUser?.id, isLogged]);

  const collectiveReadingHref = useMemo(
    () =>
      `/collective-reading/${book.id}/${encodeURIComponent(book.title)}`,
    [book.id, book.title],
  );

  const shareOnWhatsApp = useCallback(() => {
    const baseUrl = "https://nosso-tbr.vercel.app/";
    const encodedTitle = encodeURIComponent(book.title);
    const url = `${baseUrl}?search=${encodedTitle}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(url)}`;
    window.open(whatsappUrl, "_blank");
  }, [book.title]);

  const handleNavigateToSchedule = useCallback(() => {
    router.push(`/schedule/${book.id}/${book.title}`);
  }, [router, book.id, book.title]);

  const handleNavigateToAuthor = useCallback(
    () => router.push(`?search=${book.author}`),
    [router, book.author],
  );

  const handleNavigateToQuotes = useCallback(() => {
    router.push(`/quotes/${book.title}/${book.id}`);
  }, [router, book.title, book.id]);

  const handleNavigateToCollectiveReading = useCallback(() => {
    router.push(collectiveReadingHref);
  }, [router, collectiveReadingHref]);

  const handleOpenBookDetails = useCallback(() => {
    bookDetailsModal.setIsOpen(true);
  }, [bookDetailsModal.setIsOpen]);

  const handleAuthorSearchFromDetails = useCallback(() => {
    bookDetailsModal.setIsOpen(false);
    handleNavigateToAuthor();
  }, [bookDetailsModal.setIsOpen, handleNavigateToAuthor]);

  const handleCollectiveReadingFromDetails = useCallback(() => {
    bookDetailsModal.setIsOpen(false);
    handleNavigateToCollectiveReading();
  }, [bookDetailsModal.setIsOpen, handleNavigateToCollectiveReading]);

  const handleScheduleFromDetails = useCallback(() => {
    bookDetailsModal.setIsOpen(false);
    handleNavigateToSchedule();
  }, [bookDetailsModal.setIsOpen, handleNavigateToSchedule]);

  const handleQuotesFromDetails = useCallback(() => {
    bookDetailsModal.setIsOpen(false);
    handleNavigateToQuotes();
  }, [bookDetailsModal.setIsOpen, handleNavigateToQuotes]);

  const statusTransitionMutation = useMutation({
    mutationFn: async (nextStatus: Status) => {
      if (!book.id) throw new Error("Livro sem identificador.");

      const payload: BookCreateValidator = {
        title: book.title,
        pages: book.pages,
        readers: [...book.readerIds],
        chosen_by: book.chosen_by,
        user_id: book.user_id,
        author_id: book.authorId ?? "",
        start_date: book.start_date ?? null,
        end_date: book.end_date ?? null,
        planned_start_date: book.planned_start_date ?? null,
        gender: book.gender ?? "",
        image_url: book.image_url ?? "",
        status: nextStatus,
        is_reread: book.is_reread,
      };

      if (nextStatus === "reading") {
        payload.end_date = null;
        payload.planned_start_date = null;
        payload.start_date = payload.start_date ?? new Date().toISOString();
      }

      if (nextStatus === "paused") payload.planned_start_date = null;
      if (nextStatus === "abandoned") {
        payload.start_date = null;
        payload.end_date = null;
        payload.planned_start_date = null;
      }

      await new BookUpsertService().edit(book.id, payload);
    },
    onSuccess: async (_, nextStatus) => {
      const labels: Partial<Record<Status, string>> = {
        reading: "Leitura iniciada",
        finished: "Leitura finalizada",
        paused: "Leitura pausada",
        abandoned: "Leitura abandonada",
      };
      toast(labels[nextStatus] ?? "Status atualizado");
      await queryClient.invalidateQueries({ queryKey: ["books"], exact: false });
      bookDetailsModal.setIsOpen(false);
    },
    onError: (error) => {
      toast("Não foi possível atualizar o status", {
        description: error instanceof Error ? error.message : "Tente novamente.",
        className: "toast-error",
      });
    },
  });

  const changeBookStatus = useCallback(
    (nextStatus: Status) => statusTransitionMutation.mutate(nextStatus),
    [statusTransitionMutation],
  );

  const statusMap = {
    not_started: {
      bookStatusClass: "bg-gray-500 text-white",
      bookStatusText: "Ainda não iniciei a leitura",
    },
    planned: {
      bookStatusClass: "bg-gray-500 text-white",
      bookStatusText: "Ainda não iniciei a leitura",
    },
    reading: {
      bookStatusClass: "bg-green-800 text-white",
      bookStatusText: "Já iniciei a leitura",
    },
    paused: {
      bookStatusClass: "bg-violet-600 text-white",
      bookStatusText: "Leitura pausada",
    },
    abandoned: {
      bookStatusClass: "bg-rose-600 text-white",
      bookStatusText: "Livro abandonado",
    },
    finished: {
      bookStatusClass: "bg-red-500 text-white",
      bookStatusText: "Terminei a Leitura",
    },
  } as const;

  const badgeObject = statusMap[book.status ?? "not_started"];

  const formattedPlannedDate = useMemo(
    () =>
      book.planned_start_date
        ? new Date(book.planned_start_date).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })
        : null,
    [book.planned_start_date],
  );
  const formattedEndDate = useMemo(
    () =>
      book.end_date
        ? new Date(book.end_date).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })
        : null,
    [book.end_date],
  );

  const statusDisplay = useMemo((): StatusDisplay => {
    const configs: Record<string, StatusDisplay> = {
      finished: {
        label: formattedEndDate
          ? `Finalizado em ${formattedEndDate}`
          : "Leitura finalizada",
        colorClass:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
        dotClass: "bg-emerald-500",
      },
      reading: {
        label: "Lendo agora",
        colorClass:
          "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
        dotClass: "bg-amber-500",
      },
      paused: {
        label: "Leitura pausada",
        colorClass:
          "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
        dotClass: "bg-violet-500",
      },
      abandoned: {
        label: "Livro abandonado",
        colorClass:
          "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
        dotClass: "bg-rose-500",
      },
      planned: {
        label: formattedPlannedDate
          ? `Início em: ${formattedPlannedDate}`
          : "Vou ler",
        colorClass:
          "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
        dotClass: "bg-blue-500",
      },
      not_started: {
        label: formattedPlannedDate
          ? `Início em: ${formattedPlannedDate}`
          : "Vou ler",
        colorClass:
          "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
        dotClass: "bg-blue-500",
      },
    };
    return configs[book.status ?? "not_started"] ?? null;
  }, [book.status, formattedEndDate, formattedPlannedDate]);

  const handleConfirmDelete = useCallback(
    async (id: string) => {
      if (!isShelf) {
        const service = new BookService();
        await service.delete(id);
        router.replace("/");
        return;
      }
      if (!shelfId) {
        throw new Error(
          "shelfId é obrigatório para remover o livro da estante (RN55).",
        );
      }
      const service = new BookshelfServiceBooks();
      await service.removeBookFromShelf(shelfId, id);
    },
    [isShelf, shelfId, router],
  );

  const showFavoriteToggle =
    !hideInteractions && isLogged && book.status === "finished";

  const showReadingProgress =
    isLogged && !isShelf && book.status === "reading";

  const handleFavoriteClick = useCallback(
    (event?: MouseEvent<HTMLButtonElement>) => {
      event?.preventDefault();
      event?.stopPropagation();
      if (!book.id || isFavoritePending) return;
      toggleFavorite(book.id, !book.is_favorite);
    },
    [book.id, book.is_favorite, isFavoritePending, toggleFavorite],
  );

  return {
    dropdownModal,
    dialogEditModal,
    dialogDeleteModal,
    dialogAddShelfModal,
    bookDetailsModal,
    handleOpenBookDetails,
    handleAuthorSearchFromDetails,
    handleCollectiveReadingFromDetails,
    handleScheduleFromDetails,
    handleQuotesFromDetails,
    onStartReading: () => changeBookStatus("reading"),
    onFinishReading: () => changeBookStatus("finished"),
    onPauseReading: () => changeBookStatus("paused"),
    onAbandonReading: () => changeBookStatus("abandoned"),
    isStatusPending: statusTransitionMutation.isPending,
    isLogged,
    dropdownTap,
    shareOnWhatsApp,
    handleNavigateToSchedule,
    handleNavigateToAuthor,
    book,
    handleNavigateToQuotes,
    badgeObject,
    handleConfirmDelete,
    statusDisplay,
    isOwnSoloBook,
    showFavoriteToggle,
    handleFavoriteClick,
    isFavoritePending,
    canAccessCollectiveReading,
    collectiveReadingHref,
    handleNavigateToCollectiveReading,
    showReadingProgress,
  };
}
