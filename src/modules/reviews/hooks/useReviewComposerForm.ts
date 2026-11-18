"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useUserStore } from "@/stores/userStore";

import { REVIEWS_COPY } from "../constants";
import { ReviewsService } from "../services";
import { closeReviewComposer, useReviewComposerStore } from "../stores";
import {
  canSubmitReview,
  reviewContentState,
  reviewQueryKeys,
  reviewStarsAvailable,
} from "../utils";

const service = new ReviewsService();

const emptyBaseline = { stars: null as number | null, content: "" };

export function useReviewComposerForm() {
  const queryClient = useQueryClient();
  const viewerUserId = useUserStore((state) => state.user?.id ?? null);
  const open = useReviewComposerStore((state) => state.open);
  const mode = useReviewComposerStore((state) => state.mode);
  const book = useReviewComposerStore((state) => state.book);
  const selectBook = useReviewComposerStore((state) => state.selectBook);

  const [stars, setStars] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [baseline, setBaseline] = useState(emptyBaseline);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const hydratedFor = useRef<string | null>(null);
  const touched = useRef(false);
  const [draftUserId, setDraftUserId] = useState(viewerUserId);

  if (draftUserId !== viewerUserId) {
    setDraftUserId(viewerUserId);
    hydratedFor.current = null;
    touched.current = false;
    setStars(null);
    setContent("");
    setBaseline(emptyBaseline);
    setConfirmDiscard(false);
  }

  const existing = useQuery({
    queryKey: reviewQueryKeys.mineByBook(viewerUserId, book?.id ?? "none"),
    queryFn: () => service.getMineByBookId(book?.id ?? ""),
    enabled: open && Boolean(book?.id) && Boolean(viewerUserId),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const hydrationKey =
    open && viewerUserId && book?.id ? `${viewerUserId}:${book.id}` : null;

  useEffect(() => {
    if (!open) {
      hydratedFor.current = null;
      touched.current = false;
      setStars(null);
      setContent("");
      setBaseline(emptyBaseline);
      setConfirmDiscard(false);
      return;
    }
    if (!hydrationKey || !existing.data || hydratedFor.current === hydrationKey) return;
    hydratedFor.current = hydrationKey;
    if (touched.current) return;
    const nextStars = existing.data.review?.stars ?? existing.data.ratingStars;
    const nextContent = existing.data.review?.content ?? "";
    setStars(nextStars);
    setContent(nextContent);
    setBaseline({ stars: nextStars, content: nextContent });
  }, [existing.data, hydrationKey, open]);

  const contentState = reviewContentState(content);
  const liveStatus = existing.isFetchedAfterMount
    ? (existing.data?.bookStatus ?? null)
    : null;
  const currentStatus = liveStatus ?? book?.status ?? "not_started";
  const shownBook = useMemo(() => {
    if (!book) return null;
    if (!liveStatus || liveStatus === book.status) return book;
    return { ...book, status: liveStatus };
  }, [book, liveStatus]);
  const starsAvailable = useMemo(
    () => reviewStarsAvailable(currentStatus),
    [currentStatus],
  );
  const submission = useMemo(
    () =>
      canSubmitReview({
        mode: mode ?? "compose",
        stars,
        content,
        bookStatus: currentStatus,
      }),
    [content, currentStatus, mode, stars],
  );

  const dirty =
    stars !== baseline.stars || content.trim() !== baseline.content.trim();

  const save = useMutation({
    mutationFn: () => {
      const currentUserId = useUserStore.getState().user?.id ?? null;
      if (!book?.id || currentUserId !== viewerUserId) {
        return Promise.reject(new Error("stale-review-session"));
      }
      return service.upsert({
        bookId: book.id,
        stars: stars ?? 0,
        content: contentState.trimmed,
      });
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: reviewQueryKeys.all });
      void queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "bookReadingRatings",
      });
      if (!result.published) {
        toast(REVIEWS_COPY.saveRating);
      }
      closeReviewComposer();
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "stale-review-session") return;
      toast.error(
        submission.publishesReview ? REVIEWS_COPY.publishError : REVIEWS_COPY.ratingError,
        { className: "toast-error" },
      );
    },
  });

  const requestClose = useCallback(() => {
    if (!useReviewComposerStore.getState().open) return;
    if (dirty && content.trim().length > 0) {
      setConfirmDiscard(true);
      return;
    }
    closeReviewComposer();
  }, [content, dirty]);

  const discard = useCallback(() => {
    closeReviewComposer();
  }, []);

  const submit = useCallback(() => {
    if (!book || !viewerUserId || !submission.ok || save.isPending) return;
    save.mutate();
  }, [book, save, submission.ok, viewerUserId]);

  const pickStars = useCallback(
    (next: number) => {
      if (!reviewStarsAvailable(currentStatus)) return;
      touched.current = true;
      setStars(next);
    },
    [currentStatus],
  );

  const updateContent = useCallback((next: string) => {
    touched.current = true;
    setContent(next);
  }, []);

  return {
    open,
    mode,
    book: shownBook,
    selectBook,
    stars,
    starsAvailable,
    setStars: pickStars,
    content,
    setContent: updateContent,
    contentState,
    submission,
    isLoadingExisting: Boolean(book) && existing.isLoading,
    isSaving: save.isPending,
    confirmDiscard,
    setConfirmDiscard,
    requestClose,
    discard,
    submit,
    hasExistingReview: Boolean(existing.data?.review),
  };
}
