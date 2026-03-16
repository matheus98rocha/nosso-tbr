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
import { ControllerRenderProps, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookCreateSchema } from "@/modules/home/validators/createBook.validator";
import { SelectedBookshelf } from "../../shelves/types/bookshelves.types";
import { useRouter } from "next/navigation";

export function useBookDialog({
  bookData,
  setIsBookFormOpen,
  chosenByOptions,
}: UseCreateBookDialog) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [selected, setSelected] = useState<Status | null>(null);
  const [isAddToShelfEnabled, setIsAddToShelfEnabled] = useState(false);
  const [selectedShelfId, setSelectedShelfId] = useState("");
  const [isDuplicateBookDialogOpen, setIsDuplicateBookDialogOpen] =
    useState<boolean>(false);
  const isEdit: boolean = Boolean(bookData && bookData.id);

  const bookUpsertService = useMemo(() => new BookUpsertService(), []);
  const bookshelfService = useMemo(() => new BookshelfService(), []);

  const form = useForm<BookCreateValidator>({
    resolver: zodResolver(bookCreateSchema),
    defaultValues: {
      title: "",
      pages: undefined,
      readers: "",
      start_date: null,
      end_date: null,
      gender: "",
      image_url: "",
      chosen_by: bookData?.chosen_by ?? ("" as "Matheus" | "Fabi" | "Barbara"),
      user_id: bookData?.user_id ?? "",
      ...bookData,
      author_id: bookData?.authorId ?? "",
    },
  });

  const { reset, handleSubmit, control } = form;

  const handleResetForm = useCallback(() => {
    setIsBookFormOpen(false);
    reset();
    setSelected(null);
    setIsAddToShelfEnabled(false);
    setSelectedShelfId("");
  }, [setIsBookFormOpen, reset]);

  const checkboxes: { id: Status; label: string }[] = [
    { id: "not_started", label: "Vou iniciar a leitura" },
    { id: "reading", label: "Já iniciei a leitura" },
    { id: "finished", label: "Terminei a Leitura" },
  ];

  useEffect(() => {
    if (bookData) {
      setSelected(bookData.status ?? null);
    } else {
      setSelected(null);
    }
  }, [bookData]);

  const { data: bookshelves = [], isLoading: isLoadingBookshelves } = useQuery({
    queryKey: ["bookshelves"],
    queryFn: fetchBookShelves,
  });

  const bookshelfOptions =
    bookshelves?.map((shelf: SelectedBookshelf) => ({
      label: shelf.name,
      value: shelf.id,
    })) ?? [];

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
      setIsDuplicateBookDialogOpen(false);
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
      const isDuplicate = await bookUpsertService.checkDuplicateBook(
        data.title,
      );

      if (isDuplicate && !isEdit) {
        setIsDuplicateBookDialogOpen(true);
        setIsBookFormOpen(false);
        return;
      }

      const payload = { ...data };

      if (isEdit) {
        if (selected === "not_started" || selected === "planned") {
          payload.start_date = null;
          payload.end_date = null;
        } else if (selected === "reading") {
          payload.end_date = null;
          payload.planned_start_date = null;
        }
      }

      return createBook.mutate(payload);
    },
    [bookUpsertService, isEdit, createBook, setIsBookFormOpen, selected],
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
      field.onChange(selectedUserId);

      const selectedOption = chosenByOptions.find(
        (opt) => opt.value === selectedUserId,
      );

      form.setValue(
        "chosen_by",
        selectedOption?.label as "Matheus" | "Fabi" | "Barbara",
        { shouldValidate: true },
      );
    },
    [chosenByOptions, form],
  );

  const handleConfirmCreateBook = async () => {
    setIsDuplicateBookDialogOpen(false);
    const formData = form.getValues();
    createBook.mutate(formData);
  };

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

    isDuplicateBookDialogOpen,
    setIsDuplicateBookDialogOpen,

    handleConfirmCreateBook,

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
  };
}
