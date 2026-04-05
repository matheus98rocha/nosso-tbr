import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookshelfService,
  fetchBookShelves,
} from "../services/booksshelves.service";
import {
  BookshelfCreateValidator,
  BookshelfDomain,
} from "../types/bookshelves.types";
import { useUserStore } from "@/stores/userStore";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/api/isUnauthorizedError";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { QUERY_KEYS } from "@/constants/keys";

export function useBookshelves({
  handleClose,
  editShelf,
  isOpen,
}: {
  handleClose?: (open: boolean) => void;
  editShelf?: BookshelfDomain;
  isOpen: boolean;
}) {
  const queryClient = useQueryClient();
  const service = new BookshelfService();
  const user = useUserStore((state) => state.user);
  const isLoggedIn = useIsLoggedIn();
  const router = useRouter();

  const {
    data: bookshelves,
    isLoading: isFetching,
    isFetched,
    error,
    isError,
  } = useQuery({
    queryKey: QUERY_KEYS.shelves.all,
    queryFn: () => {
      return fetchBookShelves();
    },
    enabled: isLoggedIn && isOpen,
    staleTime: 1000 * 60 * 5,
  });

  const { mutate, isPending: isCreating } = useMutation({
    mutationFn: async (payload: BookshelfCreateValidator) => {
      if (editShelf) {
        await service.update(editShelf.id, payload);
      } else {
        await service.create({
          ...payload,
          user_id: user?.id || "",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookshelves"] });
      queryClient.invalidateQueries({ queryKey: ["bookshelf-meta"] });
      if (handleClose) {
        handleClose(false);
      }
    },
  });

  useEffect(() => {
    if (!isError || !isUnauthorizedError(error)) return;

    toast("Sessão expirada", {
      description: "Faça login novamente para continuar.",
      className: "toast-error",
    });
    router.push("/auth");
  }, [error, isError, router]);

  return {
    bookshelves,
    isFetching,
    error,
    isError,
    mutate,
    isCreating,
    isFetched,
  };
}
