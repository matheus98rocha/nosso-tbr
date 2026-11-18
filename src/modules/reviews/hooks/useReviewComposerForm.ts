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
  const [appliedStamp, setAppliedStamp] = useState<string | null>(null);
  const contentTouched = useRef(false);
  const starsTouched = useRef(false);
  const activeBookId = useRef<string | null>(null);

  const existing = useQuery({
    queryKey: reviewQueryKeys.mineByBook(book?.id ?? "none"),
    queryFn: () => service.getMineByBookId(book?.id ?? ""),
    enabled: open && Boolean(book?.id),
  });

  const serverStamp = useMemo(() => {
    if (!open || !book?.id || !existing.data) return null;
    const review = existing.data.review;
    return [
      book.id,
      review?.id ?? "",
      review?.content ?? "",
      review?.stars ?? "",
      existing.data.ratingStars ?? "",
      existing.dataUpdatedAt,
    ].join(":");
  }, [book?.id, existing.data, existing.dataUpdatedAt, open]);

  if (open && book?.id && activeBookId.current !== book.id) {
    activeBookId.current = book.id;
    contentTouched.current = false;
    starsTouched.current = false;
  }

  useEffect(() => {
    if (!open) {
      activeBookId.current = null;
      contentTouched.current = false;
      starsTouched.current = false;
      setAppliedStamp(null);
      setStars(null);
      setContent("");
      setBaseline({ stars: null, content: "" });
      setConfirmDiscard(false);
      return;
    }
    if (!existing.data || !serverStamp || appliedStamp === serverStamp) return;

    const serverContent = existing.data.review?.content ?? "";
    const serverStars = existing.data.review?.stars ?? existing.data.ratingStars;
    if (!contentTouched.current) setContent(serverContent);
    if (!starsTouched.current) setStars(serverStars);
    setBaseline((current) => ({
      stars: serverStars,
      content: contentTouched.current ? current.content : serverContent,
    }));
    setAppliedStamp(serverStamp);
  }, [appliedStamp, existing.data, open, serverStamp]);

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

  const failedWithoutData = Boolean(book) && existing.isError && appliedStamp === null;
  const applyingSnapshot =
    Boolean(book) &&
    existing.isSuccess &&
    serverStamp !== null &&
    appliedStamp !== serverStamp;
  const awaitingSnapshot =
    Boolean(book) && appliedStamp === null && (existing.isPending || existing.isFetching);
  const unseenReview =
    contentState.trimmed.length === 0 &&
    Boolean(existing.data?.review?.content.trim()) &&
    !contentTouched.current;
  const emptyWhileRefreshing = contentState.trimmed.length === 0 && existing.isFetching;
  const serverReady =
    Boolean(book) && appliedStamp !== null && appliedStamp === serverStamp && !failedWithoutData;
  const canSave =
    submission.ok && serverReady && !save.isPending && !unseenReview && !emptyWhileRefreshing;

  const submit = useCallback(() => {
    if (!canSave) return;
    save.mutate();
  }, [canSave, save]);

  const retryLoad = useCallback(() => {
    void existing.refetch();
  }, [existing]);

  return {
    open,
    mode,
    book,
    selectBook,
    stars,
    setStars: (next: number) => {
      starsTouched.current = true;
      setStars(next);
    },
    content,
    setContent: (next: string) => {
      contentTouched.current = true;
      setContent(next);
    },
    contentState,
    submission,
    isLoadingExisting: failedWithoutData || applyingSnapshot || awaitingSnapshot,
    loadFailed: failedWithoutData,
    canSave,
    retryLoad,
    isSaving: save.isPending,
    confirmDiscard,
    setConfirmDiscard,
    requestClose,
    discard,
    submit,
    hasExistingReview: Boolean(existing.data?.review),
  };
}
