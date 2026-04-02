import { useCallback, useMemo, useState } from "react";
import { BookCreateValidator } from "@/types/books.types";
import { BookUpsertService } from "../services/bookUpsert.service";
import {
  BookCatalogMatchResult,
  PendingCreationPayload,
  PreCreationValidationDecision,
} from "../types/bookDiscovery.types";

type UseBookPreCreationValidationParams = {
  isEdit: boolean;
  currentUserId?: string;
  bookUpsertService: BookUpsertService;
};

export function useBookPreCreationValidation({
  isEdit,
  currentUserId,
  bookUpsertService,
}: UseBookPreCreationValidationParams) {
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const [matchedBook, setMatchedBook] = useState<BookCatalogMatchResult | null>(null);
  const [pendingCreationPayload, setPendingCreationPayload] =
    useState<PendingCreationPayload>(null);

  const validateBeforeCreate = useCallback(
    async (payload: BookCreateValidator): Promise<PreCreationValidationDecision> => {
      if (isEdit) {
        return { type: "create_new" };
      }

      const catalogMatch = await bookUpsertService.findCatalogBookMatch({
        title: payload.title,
        authorId: payload.author_id,
        currentUserId,
      });

      if (!catalogMatch) {
        return { type: "create_new" };
      }

      if (catalogMatch.userAlreadyLinked) {
        return { type: "block_duplicate", match: catalogMatch };
      }

      setPendingCreationPayload(payload);
      setMatchedBook(catalogMatch);
      setIsDiscoveryOpen(true);

      return { type: "suggest_existing", match: catalogMatch };
    },
    [bookUpsertService, currentUserId, isEdit],
  );

  const closeDiscovery = useCallback(() => {
    setIsDiscoveryOpen(false);
  }, []);

  const clearDiscoveryState = useCallback(() => {
    setPendingCreationPayload(null);
    setMatchedBook(null);
    setIsDiscoveryOpen(false);
  }, []);

  const linkUserToExistingBook = useCallback(async () => {
    const candidateId = matchedBook?.candidate.id;
    if (!candidateId) {
      return false;
    }

    await bookUpsertService.linkReaderToExistingBook(candidateId);
    clearDiscoveryState();
    return true;
  }, [bookUpsertService, clearDiscoveryState, matchedBook?.candidate.id]);

  const takePendingPayloadForCreation = useCallback(() => {
    const payload = pendingCreationPayload;
    clearDiscoveryState();
    return payload;
  }, [clearDiscoveryState, pendingCreationPayload]);

  const hasDiscoveryMatch = useMemo(() => !!matchedBook, [matchedBook]);

  return {
    isDiscoveryOpen,
    matchedBook,
    hasDiscoveryMatch,
    validateBeforeCreate,
    closeDiscovery,
    clearDiscoveryState,
    linkUserToExistingBook,
    takePendingPayloadForCreation,
  };
}
