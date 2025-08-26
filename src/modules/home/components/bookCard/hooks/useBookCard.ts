import { useModal } from "@/hooks/useModal";
import { BookCardProps } from "../types/bookCard.types";
import { useRouter } from "next/navigation";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useSafeTap } from "@/hooks/useSafeTap";
import { useCallback } from "react";

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
  };
}
