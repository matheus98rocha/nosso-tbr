import { useModal } from "@/hooks/useModal";
import { BookCardProps } from "../types/bookCard.types";
import { useRouter } from "next/navigation";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useSafeTap } from "@/hooks/useSafeTap";
import { useCallback } from "react";
import { BookService } from "@/services/books/books.service";
import { BookshelfServiceBooks } from "@/modules/bookshelves/services/bookshelvesBooks.service";

export function useBookCard({ book }: BookCardProps) {
  const dropdownModal = useModal();

  const dialogEditModal = useModal();
  const dialogDeleteModal = useModal();
  const dialogAddShelfModal = useModal();

  const router = useRouter();

  const isLogged = useIsLoggedIn();

  const dropdownTap = useSafeTap(() => dropdownModal.setIsOpen(true));

  const shareOnWhatsApp = useCallback(() => {
    const baseUrl = "https://nosso-tbr.vercel.app/";
    const encodedTitle = encodeURIComponent(book.title);
    const url = `${baseUrl}?search=${encodedTitle}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(url)}`;
    window.open(whatsappUrl, "_blank");
  }, [book.title]);

  const handleNavigateToSchedule = useCallback(() => {
    router.push(`/schedule/${book.id}/${book.start_date}/${book.title}`);
  }, [router, book.id, book.start_date, book.title]);

  const handleNavigateToQuotes = useCallback(() => {
    router.push(`/quotes/${book.title}/${book.id}`);
  }, [router, book.title, book.id]);

  const statusMap = {
    not_started: {
      bookStatusClass: "bg-gray-500 text-white",
      bookStatusText: "Vou iniciar a leitura",
    },
    reading: {
      bookStatusClass: "bg-green-800 text-white",
      bookStatusText: "Já iniciei a leitura",
    },
    finished: {
      bookStatusClass: "bg-red-500 text-white",
      bookStatusText: "Terminei a Leitura",
    },
  } as const;

  const badgeObject = statusMap[book.status ?? "not_started"];

  const handleConfirmDelete = async (id: string, isShelf?: boolean) => {
    if (!isShelf) {
      const service = new BookService();
      await service.delete(id);
    } else {
      const service = new BookshelfServiceBooks();
      await service.removeBookFromShelf(id);
      window.location.reload();
    }
  };

  return {
    dropdownModal,
    dialogEditModal,
    dialogDeleteModal,
    dialogAddShelfModal,
    isLogged,
    dropdownTap,
    shareOnWhatsApp,
    handleNavigateToSchedule,
    book,
    handleNavigateToQuotes,
    badgeObject,
    handleConfirmDelete,
  };
}
