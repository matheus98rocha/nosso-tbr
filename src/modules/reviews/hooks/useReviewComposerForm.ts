"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { REVIEWS_COPY } from "../constants";
import { ReviewsService } from "../services";
import { closeReviewComposer, useReviewComposerStore } from "../stores";
import { canSubmitReview, reviewContentState, reviewQueryKeys } from "../utils";

const service = new ReviewsService();

export function useReviewComposerForm() {
  const queryClient = useQueryClient();
  const open = useReviewComposerStore((state) => state.open);
  const mode = useReviewComposerStore((state) => state.mode);
  const book = useReviewComposerStore((state) => state.book);
  const selectBook = useReviewComposerStore((state) => state.selectBook);

  const [stars, setStars] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [baseline, setBaseline] = useState({ stars: null as number | null, content: "" });
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [draftBookId, setDraftBookId] = useState<string | null>(null);
  const hydratedFor = useRef<string | null>(null);
  const touched = useRef(false);
  const bookId = book?.id ?? null;

  if (!open) {
    if (draftBookId !== null || stars !== null || content !== "" || confirmDiscard) {
      setDraftBookId(null);
      setStars(null);
      setContent("");
      setBaseline({ stars: null, content: "" });
      setConfirmDiscard(false);
      hydratedFor.current = null;
      touched.current = false;
    }
  } else if (draftBookId !== bookId) {
    setDraftBookId(bookId);
    setStars(null);
    setContent("");
    setBaseline({ stars: null, content: "" });
    setConfirmDiscard(false);
    hydratedFor.current = null;
    touched.current = false;
  }

  const existing = useQuery({
    queryKey: reviewQueryKeys.mineByBook(bookId ?? "none"),
    queryFn: () => service.getMineByBookId(bookId ?? ""),
    enabled: open && Boolean(bookId),
  });

  useEffect(() => {
    if (!open || !bookId || !existing.data || hydratedFor.current === bookId) return;
    hydratedFor.current = bookId;
    if (touched.current) return;
    const nextStars = existing.data.review?.stars ?? existing.data.ratingStars;
    const nextContent = existing.data.review?.content ?? "";
    setStars(nextStars);
    setContent(nextContent);
    setBaseline({ stars: nextStars, content: nextContent });
  }, [existing.data, open, bookId]);

  const contentState = reviewContentState(content);
  const submission = useMemo(
    () =>
      canSubmitReview({
        mode: mode ?? "compose",
        stars,
        content,
        bookStatus: book?.status ?? "not_started",
      }),
    [book?.status, content, mode, stars],
  );

  const dirty =
    stars !== baseline.stars || content.trim() !== baseline.content.trim();

  const save = useMutation({
    mutationFn: () =>
      service.upsert({
        bookId: book?.id ?? "",
        stars: stars ?? 0,
        content: contentState.trimmed,
      }),
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
    onError: () => {
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
    if (!book || !submission.ok || save.isPending) return;
    save.mutate();
  }, [book, save, submission.ok]);

  return {
    open,
    mode,
    book,
    selectBook,
    stars,
    setStars: (next: number) => {
      touched.current = true;
      setStars(next);
    },
    content,
    setContent: (next: string) => {
      touched.current = true;
      setContent(next);
    },
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
