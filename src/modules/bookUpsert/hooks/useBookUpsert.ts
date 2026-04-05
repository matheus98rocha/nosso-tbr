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
import { usePlannedStartDateLabel } from "./usePlannedStartDateLabel";
import { usePlannedStartDateFieldVisibility } from "./usePlannedStartDateFieldVisibility";

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
    isDiscoveryOpen,
    isParticipationBlockOpen,
    isLinkingToExistingBook,
    matchedBook,
    form,
    reset,
    handleSubmit,
    control,
    checkboxes,
    isEdit,
    isLoadingBookshelves,
    bookshelfOptions,
    handleLinkToExistingBook,
    handleIgnoreAndCreateNewBook,
    closeDiscovery,
    closeParticipationBlock,
    handleOnChangePageNumber,
    handleChosenByChange,
  } = useBookDialog({
    isBookFormOpen,
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

  const handleCancelDiscoveryDialog = useCallback(() => {
    closeDiscovery();
    setIsBookFormOpen(true);
  }, [closeDiscovery, setIsBookFormOpen]);

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

  const { plannedStartDateLabel } = usePlannedStartDateLabel(selected);

  const { shouldShowPlannedStartDate } = usePlannedStartDateFieldVisibility({
    selectedStatus: selected,
  });

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
    isDiscoveryOpen,
    isParticipationBlockOpen,
    isLinkingToExistingBook,
    matchedBook,
    handleLinkToExistingBook,
    handleIgnoreAndCreateNewBook,
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
    handleCancelDiscoveryDialog,
    closeParticipationBlock,
    handleStatusChange,
    handlePageNumberChange,
    handleChosenByFieldChange,
    handleAuthorSearchChange,
    plannedStartDateLabel,
    shouldShowPlannedStartDate,
    bookData,
  };
}
