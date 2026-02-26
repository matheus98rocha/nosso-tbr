import React, { useCallback, useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useUser } from "@/services/users/hooks/useUsers";
import { CreateBookProps } from "../bookUpsert.types";
import { useBookDialog } from "./useBookDialog";
import { AuthorsService } from "../../authors/services/authors.service";
import { ComboboxOption } from "../types/authorOptions";
import { BookCreateValidator } from "@/types/books.types";
import { ControllerRenderProps } from "react-hook-form";

export function useBookUpsert({
  bookData,
  isBookFormOpen,
  setIsBookFormOpen,
}: CreateBookProps) {
  const isLoggedIn = useIsLoggedIn();
  const { chosenByOptions, isLoadingUsers } = useUser();

  const {
    onSubmit,
    isLoading,
    isAddToShelfEnabled,
    selected,
    selectedShelfId,
    setIsAddToShelfEnabled,
    setSelected,
    setSelectedShelfId,
    isDuplicateBookDialogOpen,
    setIsDuplicateBookDialogOpen,
    form,
    reset,
    handleSubmit,
    control,
    checkboxes,
    isEdit,
    isLoadingBookshelves,
    bookshelfOptions,
    handleConfirmCreateBook,
    handleOnChangePageNumber,
    handleChosenByChange,
  } = useBookDialog({
    bookData,
    setIsBookFormOpen,
    chosenByOptions,
  });

  const [authorSearch, setAuthorSearch] = useState("");
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);

  const deferredAuthorSearch = useDeferredValue(authorSearch);

  const authorsService = useMemo(() => new AuthorsService(), []);

  const canEnabledAuthorsRequest = useMemo(
    () => !!deferredAuthorSearch && isBookFormOpen,
    [deferredAuthorSearch, isBookFormOpen],
  );

  const { data: authors = [], isLoading: isLoadingAuthors } = useQuery({
    queryKey: ["authors", deferredAuthorSearch],
    queryFn: () => authorsService.searchAuthors(deferredAuthorSearch),
    staleTime: 1000 * 60 * 5,
    enabled: canEnabledAuthorsRequest,
  });

  const emptyAuthorSearch = useMemo(
    () => !!deferredAuthorSearch && authors.length === 0,
    [deferredAuthorSearch, authors.length],
  );

  const handleOpenAddAuthorModal = useCallback(() => {
    setIsAuthorModalOpen(true);
  }, []);

  const handleAuthorModalOpenChange = useCallback((open: boolean) => {
    setIsAuthorModalOpen(open);
  }, []);

  const handleAuthorCreated = useCallback(
    (authorId?: string) => {
      form.setValue("author_id", authorId ?? "");
    },
    [form],
  );

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        reset();
        setSelected(null);
        setAuthorSearch("");
      }
      setIsBookFormOpen(open);
    },
    [reset, setSelected, setIsBookFormOpen],
  );

  const handleCancelDuplicateDialog = useCallback(() => {
    setIsDuplicateBookDialogOpen(false);
    setIsBookFormOpen(true);
  }, [setIsDuplicateBookDialogOpen, setIsBookFormOpen]);

  const handleDuplicateDialogOpenChange = useCallback(
    (open: boolean) => {
      setIsDuplicateBookDialogOpen(open);
    },
    [setIsDuplicateBookDialogOpen],
  );

  const handleStatusChange = useCallback(
    (id: string) => {
      setSelected((current) =>
        current === id ? null : (id as typeof current),
      );
    },
    [setSelected],
  );

  const handlePageNumberChange = useCallback(
    (
      field: ControllerRenderProps<BookCreateValidator, "pages">,
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      handleOnChangePageNumber(field, e);
    },
    [handleOnChangePageNumber],
  );

  const handleChosenByFieldChange = useCallback(
    (
      field: ControllerRenderProps<BookCreateValidator, "user_id">,
      selectedUserId: string,
    ) => {
      handleChosenByChange(field, selectedUserId);
    },
    [handleChosenByChange],
  );

  const handleAuthorSearchChange = useCallback((search: string) => {
    setAuthorSearch(search);
  }, []);

  return {
    isLoggedIn,
    chosenByOptions,
    isLoadingUsers,
    onSubmit,
    isLoading,
    isAddToShelfEnabled,
    selected,
    selectedShelfId,
    setIsAddToShelfEnabled,
    setSelectedShelfId,
    isDuplicateBookDialogOpen,
    handleConfirmCreateBook,
    form,
    reset,
    handleSubmit,
    control,
    checkboxes,
    isEdit,
    isLoadingBookshelves,
    bookshelfOptions,
    authors: authors as ComboboxOption[],
    isLoadingAuthors,
    emptyAuthorSearch,
    isAuthorModalOpen,
    handleOpenAddAuthorModal,
    handleAuthorModalOpenChange,
    handleAuthorCreated,
    authorSearch,
    handleDialogOpenChange,
    handleDuplicateDialogOpenChange,
    handleCancelDuplicateDialog,
    handleStatusChange,
    handlePageNumberChange,
    handleChosenByFieldChange,
    handleAuthorSearchChange,
    bookData,
  };
}
