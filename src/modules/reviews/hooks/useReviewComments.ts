"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { useUserStore } from "@/stores/userStore";

import { REVIEWS_COPY } from "../constants";
import { mapReviewComment } from "../services/mappers/review.mapper";
import { ReviewsService } from "../services";
import type { ReviewComment } from "../types";
import { reviewQueryKeys } from "../utils";

const service = new ReviewsService();

export function useReviewComments(reviewId: string | null) {
  const queryClient = useQueryClient();
  const userId = useUserStore((state) => state.user?.id ?? null);
  const [replyTo, setReplyTo] = useState<{
    parentId: string;
    name: string;
  } | null>(null);

  const queryKey = reviewQueryKeys.comments(reviewId ?? "none");

  const query = useQuery({
    queryKey,
    queryFn: () => service.listComments(reviewId ?? ""),
    enabled: Boolean(reviewId),
  });

  const create = useMutation({
    mutationFn: (input: { content: string; parentId: string | null }) =>
      service.createComment({
        reviewId: reviewId ?? "",
        content: input.content,
        parentId: input.parentId,
      }),
    onMutate: async (input) => {
      const tempId = `pending-${crypto.randomUUID()}`;
      const optimistic: ReviewComment = {
        id: tempId,
        reviewId: reviewId ?? "",
        userId: userId ?? "",
        parentId: input.parentId,
        content: input.content.trim(),
        createdAt: new Date().toISOString(),
        authorDisplayName: "Você",
        authorAvatarSeed: null,
        pending: true,
      };
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ReviewComment[]>(queryKey);
      queryClient.setQueryData<ReviewComment[]>(queryKey, (current = []) => [
        ...current,
        optimistic,
      ]);
      return { previous, tempId };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(REVIEWS_COPY.commentError, { className: "toast-error" });
    },
    onSuccess: (row, _input, context) => {
      const saved = mapReviewComment(row);
      queryClient.setQueryData<ReviewComment[]>(queryKey, (current = []) =>
        current.map((item) => (item.id === context?.tempId ? saved : item)),
      );
      void queryClient.invalidateQueries({ queryKey: reviewQueryKeys.all });
    },
  });

  const remove = useMutation({
    mutationFn: (commentId: string) => service.deleteComment(commentId),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ReviewComment[]>(queryKey);
      queryClient.setQueryData<ReviewComment[]>(queryKey, (current = []) =>
        current.filter((item) => item.id !== commentId && item.parentId !== commentId),
      );
      return { previous };
    },
    onError: (_error, _commentId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(REVIEWS_COPY.deleteError, { className: "toast-error" });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reviewQueryKeys.all });
    },
  });

  const publish = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!reviewId || !trimmed) return;
      create.mutate({ content: trimmed, parentId: replyTo?.parentId ?? null });
      setReplyTo(null);
    },
    [create, replyTo?.parentId, reviewId],
  );

  return {
    comments: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    replyTo,
    setReplyTo,
    publish,
    isPublishing: create.isPending,
    remove: remove.mutateAsync,
    isRemoving: remove.isPending,
    currentUserId: userId,
  };
}
