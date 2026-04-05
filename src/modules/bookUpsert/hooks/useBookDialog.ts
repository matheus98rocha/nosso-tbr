import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookCreateValidator, Status } from "@/types/books.types";
import { BookUpsertService } from "../services/bookUpsert.service";
import { toast } from "sonner";
import {
  BookshelfService,
  fetchBookShelves,
} from "../../shelves/services/booksshelves.service";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { UseCreateBookDialog } from "../bookUpsert.types";
import {
  ControllerRenderProps,
  type DefaultValues,
  useForm,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookCreateSchema } from "@/modules/home/validators/createBook.validator";
import { SelectedBookshelf } from "../../shelves/types/bookshelves.types";
import { useRouter } from "next/navigation";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { LOCKED_BOOK_STATUSES } from "@/constants/bookStatuses";
import { isUnauthorizedError } from "@/lib/api/isUnauthorizedError";
import { useRequireAuth } from "@/stores/hooks/useAuth";
import { useBookPreCreationValidation } from "./useBookPreCreationValidation";
import { QUERY_KEYS } from "@/constants/keys";

const checkboxes: { id: Status; label: string }[] = [
  { id: "not_started", label: "Vou iniciar a leitura" },
  { id: "reading", label: "Já iniciei a leitura" },
  { id: "paused", label: "Leitura pausada" },
  { id: "abandoned", label: "Livro abandonado" },
  { id: "finished", label: "Terminei a Leitura" },
];

export function useBookDialog({
  bookData,
  setIsBookFormOpen,
  isBookFormOpen,
}: UseCreateBookDialog) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const isLoggedIn = useIsLoggedIn();
  const authUser = useRequireAuth();

  const [selected, setSelected] = useState<Status | null>(null);
  const [isAddToShelfEnabled, setIsAddToShelfEnabled] = useState(false);
  const [selectedShelfId, setSelectedShelfId] = useState("");
  const isEdit: boolean = Boolean(bookData && bookData.id);

  const bookUpsertService = useMemo(() => new BookUpsertService(), []);
  const bookshelfService = useMemo(() => new BookshelfService(), []);
  const {
    isDiscoveryOpen,
    isParticipationBlockOpen,
    isLinkingToExistingBook,
    matchedBook,
    validateBeforeCreate,
    closeDiscovery,
    closeParticipationBlock,
    linkUserToExistingBook,
    takePendingPayloadForCreation,
  } = useBookPreCreationValidation({
    isEdit,
    currentUserId: authUser?.id,
    bookUpsertService,
  });

  const emptyDefaults = useMemo(
    (): DefaultValues<BookCreateValidator> => ({
      title: "",
      readers: [],
      start_date: null,
      end_date: null,
      planned_start_date: null,
      gender: "",
      image_url: "",
      chosen_by: "",
      user_id: "",
      author_id: "",
    }),
    [],
  );

  const form = useForm<BookCreateValidator>({
    resolver: zodResolver(bookCreateSchema),
    defaultValues: emptyDefaults,
  });

  const { reset, handleSubmit, control } = form;

  useEffect(() => {
    if (bookData?.id) {
      reset({
        ...emptyDefaults,
        title: bookData.title,
        pages: bookData.pages,
        readers: [...bookData.readerIds],
        chosen_by: bookData.chosen_by,
        user_id: bookData.chosen_by,
        author_id: bookData.authorId ?? "",
        start_date: bookData.start_date ?? null,
        end_date: bookData.end_date ?? null,
        planned_start_date: bookData.planned_start_date ?? null,
        gender: bookData.gender ?? "",
        image_url: bookData.image_url ?? "",
        status: bookData.status,
        id: bookData.id,
      });
      setSelected(bookData.status ?? null);
    } else {
      reset(emptyDefaults);
      setSelected(null);
    }
  }, [bookData?.id, bookData, reset, emptyDefaults]);

  const handleResetForm = useCallback(() => {
    setIsBookFormOpen(false);
    reset(emptyDefaults);
    setSelected(null);
    setIsAddToShelfEnabled(false);
    setSelectedShelfId("");
  }, [setIsBookFormOpen, reset, emptyDefaults]);

  const { data: bookshelves = [], isLoading: isLoadingBookshelves } = useQuery({
    queryKey: QUERY_KEYS.shelves.all,
    queryFn: () => {
      console.log("fetching bookshelves from useBookDialog");
      return fetchBookShelves();
    },
    enabled: isLoggedIn && isBookFormOpen,
    staleTime: 1000 * 60 * 5,
  });

  const bookshelfOptions = useMemo(
    () =>
      bookshelves?.map((shelf: SelectedBookshelf) => ({
        label: shelf.name,
        value: shelf.id,
      })) ?? [],
    [bookshelves],
  );

  const createBook = useMutation({
    mutationFn: async (data: BookCreateValidator) => {
      if (isEdit) {
        if (!bookData || !bookData.id) throw new Error("Erro inesperado.");
        return await bookUpsertService.edit(bookData.id, data);
      } else {
        const createdBook = await bookUpsertService.create(data);
        if (isAddToShelfEnabled && createdBook?.id) {
          await bookshelfService.addBookToShelf(
            selectedShelfId,
            createdBook.id,
          );
        }
        return createdBook;
      }
    },
    onSuccess: async (result) => {
      const createdBookId = isEdit ? bookData?.id : result?.id;

      handleResetForm();
      closeDiscovery();
      toast("Livro salvo com sucesso!");

      await queryClient.invalidateQueries({
        queryKey: ["books"],
        exact: false,
      });

      if (!isEdit && createdBookId) {
        router.replace(`/?bookId=${createdBookId}`);
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

      if (error instanceof Error) {
        toast("Erro ao salvar livro", {
          description: error.message || "Ocorreu um erro inesperado.",
          className: "toast-error",
        });
      }
    },
  });

  const onSubmit = useCallback(
    async (data: BookCreateValidator) => {
      const decision = await validateBeforeCreate(data);
      if (decision.type === "block_duplicate") {
        return;
      }

      if (decision.type === "suggest_existing") {
        setIsBookFormOpen(false);
        return;
      }

      const payload: BookCreateValidator = {
        ...data,
        status: selected ?? data.status ?? "not_started",
      };

      if (payload.status === "not_started" || payload.status === "planned") {
        payload.start_date = null;
        payload.end_date = null;
      }

      if (payload.status === "reading") {
        payload.end_date = null;
        payload.planned_start_date = null;
      }

      if (payload.status === "paused") {
        payload.planned_start_date = null;
      }

      if (payload.status === "abandoned") {
        payload.start_date = null;
        payload.end_date = null;
        payload.planned_start_date = null;
      }

      return createBook.mutate(payload);
    },
    [validateBeforeCreate, createBook, setIsBookFormOpen, selected],
  );

  const handleOnChangePageNumber = useCallback(
    (
      field: ControllerRenderProps<BookCreateValidator, "pages">,
      e: ChangeEvent<HTMLInputElement>,
    ) => {
      const val = e.target.value;
      const parsed = val === "" ? undefined : Number(val);
      field.onChange(parsed);
    },
    [],
  );

  const handleChosenByChange = useCallback(
    (
      field: ControllerRenderProps<BookCreateValidator, "user_id">,
      selectedUserId: string,
    ) => {
      const isDeselecting = field.value === selectedUserId;

      if (isDeselecting) {
        field.onChange("");
        form.setValue("chosen_by", "", { shouldValidate: true });
        return;
      }

      field.onChange(selectedUserId);
      form.setValue("chosen_by", selectedUserId, { shouldValidate: true });
    },
    [form],
  );

  const handleLinkToExistingBook = useCallback(async () => {
    const linked = await linkUserToExistingBook();
    if (!linked) {
      return;
    }

    toast("Livro adicionado à sua biblioteca!");
    await queryClient.invalidateQueries({ queryKey: ["books"], exact: false });
    setIsBookFormOpen(false);
  }, [linkUserToExistingBook, queryClient, setIsBookFormOpen]);

  const handleIgnoreAndCreateNewBook = useCallback(() => {
    const payload = takePendingPayloadForCreation();
    if (!payload) {
      return;
    }
    createBook.mutate(payload);
  }, [createBook, takePendingPayloadForCreation]);

  const handleStatusChange = useCallback(
    (id: string) => {
      const statusId = id as Status;

      if (!isEdit && LOCKED_BOOK_STATUSES.includes(statusId)) {
        return;
      }

      if (
        isEdit &&
        LOCKED_BOOK_STATUSES.includes(statusId) &&
        bookData?.status !== "reading"
      ) {
        return;
      }

      setSelected((current) => (current === statusId ? null : statusId));
    },
    [bookData?.status, isEdit, setSelected],
  );

  return {
    onSubmit,
    isLoading: createBook.isPending,
    isSuccess: createBook.isSuccess,
    isError: createBook.isError,
    error: createBook.error,

    selected,
    setSelected,

    isAddToShelfEnabled,
    setIsAddToShelfEnabled,

    selectedShelfId,
    setSelectedShelfId,

    isDiscoveryOpen,
    isParticipationBlockOpen,
    matchedBook,
    isLinkingToExistingBook,

    handleLinkToExistingBook,
    handleIgnoreAndCreateNewBook,
    closeDiscovery,
    closeParticipationBlock,

    form,
    reset,
    handleSubmit,
    control,
    checkboxes,
    isEdit,
    isLoadingBookshelves,
    bookshelfOptions,

    handleOnChangePageNumber,
    handleChosenByChange,
    handleStatusChange,
  };
}
