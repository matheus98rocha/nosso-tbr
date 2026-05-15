import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useUser } from "@/services/users/hooks/useUsers";
import { BookCreateValidator } from "@/types/books.types";
import { ControllerRenderProps } from "react-hook-form";

import { AuthorsService } from "../../authors/services/authors.service";
import { CreateBookProps } from "../bookUpsert.types";
import { ComboboxOption } from "../types/authorOptions";
import { useBookDialog } from "./useBookDialog";
import { useBookLookupV2 } from "./useBookLookupV2";
import { usePlannedStartDateFieldVisibility } from "./usePlannedStartDateFieldVisibility";
import { usePlannedStartDateLabel } from "./usePlannedStartDateLabel";

function detectLookupType(query: string): "isbn" | "title" {
  const digits = query.replace(/[\s\-]/g, "");
  if (/^\d{10}$/.test(digits) || /^\d{13}$/.test(digits)) return "isbn";
  return "title";
}

export function useBookUpsert({
  bookData,
  isBookFormOpen,
  setIsBookFormOpen,
  initialLookupQuery,
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

  const {
    book: foundBook,
    isLoading: isSearchingBooks,
    error: lookupError,
    lookup,
    clear: clearBookLookup,
  } = useBookLookupV2();

  const [lookupQuery, setLookupQuery] = useState("");
  const [authorSearch, setAuthorSearch] = useState("");
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [pendingAuthorLookup, setPendingAuthorLookup] = useState(false);

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
        setSelected("not_started");
        setAuthorSearch("");
        setLookupQuery("");
        clearBookLookup();
        setPendingAuthorLookup(false);
      }
      setIsBookFormOpen(open);
    },
    [reset, setSelected, setIsBookFormOpen, clearBookLookup],
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

  const handleLookupQueryChange = useCallback(
    (query: string) => {
      setLookupQuery(query);
      if (!query.trim()) clearBookLookup();
    },
    [clearBookLookup],
  );

  const handleSearchBooks = useCallback(() => {
    const trimmed = lookupQuery.trim();
    if (!trimmed) return;
    const type = detectLookupType(trimmed);
    lookup(
      type === "isbn"
        ? { type: "isbn", value: trimmed }
        : { type: "title", value: trimmed },
    );
  }, [lookupQuery, lookup]);

  useEffect(() => {
    if (!pendingAuthorLookup || isLoadingAuthors || !deferredAuthorSearch) return;
    if (authors.length === 0) {
      setPendingAuthorLookup(false);
      setIsAuthorModalOpen(true);
      return;
    }
    const match =
      authors.find(
        (a) => a.name.toLowerCase() === deferredAuthorSearch.toLowerCase(),
      ) ?? authors[0];
    form.setValue("author_id", String(match.id));
    setPendingAuthorLookup(false);
  }, [pendingAuthorLookup, isLoadingAuthors, authors, deferredAuthorSearch, form]);

  useEffect(() => {
    if (!foundBook) return;
    form.setValue("title", foundBook.nome_do_livro);
    if (foundBook.paginas) form.setValue("pages", foundBook.paginas);
    if (foundBook.url_capa) form.setValue("image_url", foundBook.url_capa);
    if (foundBook.genero) form.setValue("gender", foundBook.genero);
    if (foundBook.autor) {
      setAuthorSearch(foundBook.autor);
      setPendingAuthorLookup(true);
    }
  }, [foundBook, form]);

  const lastAppliedInitialQuery = useRef<string | null>(null);

  useEffect(() => {
    if (!isBookFormOpen) {
      lastAppliedInitialQuery.current = null;
      return;
    }
    if (isEdit) return;
    const query = initialLookupQuery?.trim();
    if (!query) return;
    if (lastAppliedInitialQuery.current === query) return;
    lastAppliedInitialQuery.current = query;
    setLookupQuery(query);
    form.setValue("title", query);
    lookup({ type: "title", value: query });
  }, [isBookFormOpen, initialLookupQuery, isEdit, form, lookup]);

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
    foundBook,
    isSearchingBooks,
    lookupError,
    lookupQuery,
    handleLookupQueryChange,
    handleSearchBooks,
  };
}
