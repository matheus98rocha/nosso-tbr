"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { BookDomain } from "@/types/books.types";

import type {
  BookCardDetailsModalProps,
  BookDetailsCommand,
  BookDetailsPrimaryAction,
} from "../types/bookCardDetailsModal.types";
import {
  buildBookReadingInsights,
  buildBookReference,
  buildBookTimeline,
  splitReaderLabels,
} from "../utils";
import { useAddBookReader } from "./useAddBookReader";

const SCHEDULE_DISABLED_REASON =
  "Cronograma indisponível para livros finalizados";
const QUOTES_DISABLED_REASON =
  "Citações ficam disponíveis após iniciar a leitura";

function canStart(status: BookDomain["status"]) {
  return (
    status === "not_started" ||
    status === "planned" ||
    status === "paused" ||
    status === "abandoned"
  );
}

function startLabel(status: BookDomain["status"]) {
  if (status === "paused" || status === "abandoned") return "Retomar leitura";
  return "Iniciar leitura";
}

export function useBookCardDetailsModal({
  book,
  isLogged,
  canAccessCollectiveReading,
  scheduleDisabled,
  quotesDisabled,
  onAuthorSearch,
  onCollectiveReading,
  onOpenSchedule,
  onOpenQuotes,
  onStartReading,
  onFinishReading,
  onPauseReading,
  onAbandonReading,
  onShare,
  onToggleFavorite,
  onAddToShelf,
  onEdit,
  onDelete,
  deleteLabel = "Deletar livro",
  deleteHint = "Some da biblioteca",
  onAddToLibrary,
  showFavoriteToggle = false,
  showLibraryActions = false,
  showAddToLibrary = false,
  isFavoritePending = false,
  isAddToLibraryPending = false,
  isStatusPending = false,
}: BookCardDetailsModalProps) {
  const [abandonConfirmationOpen, setAbandonConfirmationOpen] = useState(false);
  const [referenceCopied, setReferenceCopied] = useState(false);
  const addReader = useAddBookReader({
    bookId: book.id,
    enabled: showLibraryActions,
  });

  useEffect(() => {
    if (!referenceCopied) return;
    const timeoutId = window.setTimeout(() => setReferenceCopied(false), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [referenceCopied]);

  const insights = useMemo(
    () =>
      buildBookReadingInsights(
        {
          pages: book.pages,
          status: book.status,
          start_date: book.start_date,
          end_date: book.end_date,
          planned_start_date: book.planned_start_date,
        },
        new Date(),
      ),
    [
      book.end_date,
      book.pages,
      book.planned_start_date,
      book.start_date,
      book.status,
    ],
  );

  const timeline = useMemo(
    () =>
      buildBookTimeline({
        planned_start_date: book.planned_start_date,
        start_date: book.start_date,
        end_date: book.end_date,
        status: book.status,
      }),
    [book.end_date, book.planned_start_date, book.start_date, book.status],
  );

  const readers = useMemo(
    () => (isLogged ? splitReaderLabels(book.readersDisplay ?? "") : []),
    [book.readersDisplay, isLogged],
  );

  const ratingStars = useMemo(() => {
    if (book.status !== "finished") return null;
    return book.reading_rating_stars ?? null;
  }, [book.reading_rating_stars, book.status]);

  const copyReference = useCallback(async () => {
    const text = buildBookReference({
      title: book.title,
      author: book.author,
      pages: book.pages,
    });
    try {
      await navigator.clipboard.writeText(text);
      setReferenceCopied(true);
      toast.success("Referência copiada");
    } catch {
      toast.error("Não foi possível copiar a referência");
    }
  }, [book.author, book.pages, book.title]);

  const confirmAbandon = useCallback(() => {
    onAbandonReading?.();
    setAbandonConfirmationOpen(false);
  }, [onAbandonReading]);

  const primary = useMemo((): BookDetailsPrimaryAction | null => {
    if (showAddToLibrary && onAddToLibrary) {
      return {
        label: "Adicionar à biblioteca",
        icon: "library",
        disabled: isAddToLibraryPending,
        tone: "library",
        onSelect: onAddToLibrary,
      };
    }

    if (isLogged && canStart(book.status) && onStartReading) {
      return {
        label: startLabel(book.status),
        icon: "play",
        disabled: isStatusPending,
        tone: "start",
        onSelect: onStartReading,
      };
    }

    if (isLogged && book.status === "reading" && onFinishReading) {
      return {
        label: "Finalizar leitura",
        icon: "finish",
        disabled: isStatusPending,
        tone: "finish",
        onSelect: onFinishReading,
      };
    }

    return null;
  }, [
    book.status,
    isAddToLibraryPending,
    isLogged,
    isStatusPending,
    onAddToLibrary,
    onFinishReading,
    onStartReading,
    showAddToLibrary,
  ]);

  const secondary = useMemo((): BookDetailsCommand[] => {
    if (!isLogged || book.status !== "reading") return [];

    const actions: BookDetailsCommand[] = [];
    if (onPauseReading) {
      actions.push({
        id: "pause",
        label: "Pausar leitura",
        hint: "Continua na biblioteca",
        icon: "pause",
        disabled: isStatusPending,
        onSelect: onPauseReading,
      });
    }
    if (onAbandonReading) {
      actions.push({
        id: "abandon",
        label: "Abandonar leitura",
        hint: "Sai do em andamento",
        icon: "abandon",
        disabled: isStatusPending,
        onSelect: () => setAbandonConfirmationOpen(true),
      });
    }
    return actions;
  }, [book.status, isLogged, isStatusPending, onAbandonReading, onPauseReading]);

  const commands = useMemo((): BookDetailsCommand[] => {
    const items: BookDetailsCommand[] = [];

    if (isLogged) {
      items.push({
        id: "schedule",
        label: "Cronograma",
        hint: scheduleDisabled ? SCHEDULE_DISABLED_REASON : "Plano de páginas",
        icon: "calendar",
        disabled: scheduleDisabled,
        title: scheduleDisabled ? SCHEDULE_DISABLED_REASON : undefined,
        onSelect: onOpenSchedule,
      });
      items.push({
        id: "quotes",
        label: "Citações",
        hint: quotesDisabled ? QUOTES_DISABLED_REASON : "Trechos desta leitura",
        icon: "quotes",
        disabled: quotesDisabled,
        title: quotesDisabled ? QUOTES_DISABLED_REASON : undefined,
        onSelect: onOpenQuotes,
      });
    }

    items.push({
      id: "author",
      label: "Buscar por autor",
      hint: "Outros livros na biblioteca",
      icon: "search",
      disabled: false,
      onSelect: onAuthorSearch,
    });

    if (canAccessCollectiveReading) {
      items.push({
        id: "collective",
        label: "Leitura coletiva",
        hint: "Sala do grupo",
        icon: "collective",
        disabled: false,
        onSelect: onCollectiveReading,
      });
    }

    items.push({
      id: "copy",
      label: referenceCopied ? "Referência copiada" : "Copiar referência",
      hint: referenceCopied ? "Pronta para colar" : "Título, autor e páginas",
      icon: referenceCopied ? "check" : "copy",
      disabled: false,
      onSelect: () => {
        void copyReference();
      },
    });

    if (onShare) {
      items.push({
        id: "share",
        label: "Compartilhar",
        hint: "Enviar no WhatsApp",
        icon: "share",
        disabled: false,
        onSelect: onShare,
      });
    }

    if (showLibraryActions && book.id) {
      items.push({
        id: "add-reader",
        label: "Adicionar novo leitor",
        hint: "Quem você segue",
        icon: "reader",
        disabled: false,
        onSelect: addReader.openDialog,
      });
    }

    if (showLibraryActions && onAddToShelf) {
      items.push({
        id: "shelf",
        label: "Adicionar à estante",
        hint: "Organizar a ficha",
        icon: "shelf",
        disabled: false,
        onSelect: onAddToShelf,
      });
    }

    if (showLibraryActions && onEdit) {
      items.push({
        id: "edit",
        label: "Editar livro",
        hint: "Corrigir a ficha",
        icon: "edit",
        disabled: false,
        onSelect: onEdit,
      });
    }

    if (showLibraryActions && onDelete) {
      items.push({
        id: "delete",
        label: deleteLabel,
        hint: deleteHint,
        icon: "trash",
        disabled: false,
        danger: true,
        onSelect: onDelete,
      });
    }

    if (showFavoriteToggle && onToggleFavorite) {
      items.push({
        id: "favorite",
        label: book.is_favorite ? "Remover favorito" : "Marcar favorito",
        hint: book.is_favorite ? "Sai dos destaques" : "Guardar nos destaques",
        icon: "favorite",
        disabled: isFavoritePending,
        pressed: book.is_favorite,
        onSelect: onToggleFavorite,
      });
    }

    return items;
  }, [
    addReader.openDialog,
    book.id,
    book.is_favorite,
    canAccessCollectiveReading,
    copyReference,
    isFavoritePending,
    isLogged,
    onAddToShelf,
    onAuthorSearch,
    onCollectiveReading,
    deleteHint,
    deleteLabel,
    onDelete,
    onEdit,
    onOpenQuotes,
    onOpenSchedule,
    onShare,
    onToggleFavorite,
    quotesDisabled,
    referenceCopied,
    scheduleDisabled,
    showFavoriteToggle,
    showLibraryActions,
  ]);

  return {
    abandonConfirmationOpen,
    setAbandonConfirmationOpen,
    confirmAbandon,
    insights,
    timeline,
    readers,
    ratingStars,
    primary,
    secondary,
    commands,
    addReader,
  };
}
