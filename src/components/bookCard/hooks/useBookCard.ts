import { useModal, useSafeTap } from "@/hooks";
import { BookCardProps, StatusDisplay } from "../types/bookCard.types";
import { useRouter } from "next/navigation";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useCallback, useMemo } from "react";
import { BookService } from "@/services/books/books.service";
import { BookshelfServiceBooks } from "@/modules/bookshelves/services/bookshelvesBooks.service";
import { BookMapper } from "@/services/books/books.mapper";
import { useUserStore } from "@/stores/userStore";

export function useBookCard({
  book,
  isShelf = false,
  shelfId,
}: BookCardProps) {
  const dropdownModal = useModal();
  const dialogEditModal = useModal();
  const dialogDeleteModal = useModal();
  const dialogAddShelfModal = useModal();

  const router = useRouter();
  const isLogged = useIsLoggedIn();
  const currentUser = useUserStore((state) => state.user);
  const dropdownTap = useSafeTap(() => dropdownModal.setIsOpen(true));

  const isSoloBook = useMemo(() => BookMapper.isSoloBook(book), [book]);
  const isOwnSoloBook = useMemo(
    () => isSoloBook && !!currentUser?.id && book.chosen_by === currentUser.id,
    [isSoloBook, currentUser?.id, book.chosen_by],
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
        label: `Finalizado em ${formattedEndDate}`,
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
        return;
      }
      if (!shelfId) {
        throw new Error(
          "shelfId é obrigatório para remover o livro da estante (RN55).",
        );
      }
      const service = new BookshelfServiceBooks();
      await service.removeBookFromShelf(shelfId, id);
      window.location.reload();
    },
    [isShelf, shelfId],
  );

  return {
    dropdownModal,
    dialogEditModal,
    dialogDeleteModal,
    dialogAddShelfModal,
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
  };
}
