import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

import { useSchedule } from "@/modules/schedule/hooks/useSchedule";
import { useUserStore } from "@/stores/userStore";

import { CollectiveReadingCommentsService } from "../services/collectiveReadingComments.service";
import type { CollectiveReadingCommentDomain } from "../types/collectiveReading.types";
import {
  getCollectiveReadingCommentsQueryKey,
  getCollectiveReadingGateQueryKey,
} from "../utils/collectiveReadingCommentQueryKey";
import { getCurrentScheduleChapterInfo } from "../utils/currentScheduleChapter";
import { useCollectiveReadingCommentsRealtime } from "./useCollectiveReadingCommentsRealtime";

export function useCollectiveReadingScreen(bookId: string) {
  const { user } = useUserStore();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [deleteCommentOpen, setDeleteCommentOpen] = useState(false);

  const service = useMemo(() => new CollectiveReadingCommentsService(), []);

  const {
    schedule,
    isLoadingSchedule,
  } = useSchedule({ id: bookId });

  const gateQuery = useQuery({
    queryKey: getCollectiveReadingGateQueryKey(bookId, userId ?? ""),
    queryFn: () => service.checkAccess(bookId, userId!),
    enabled: Boolean(userId && bookId),
  });

  const gateCanAccess = Boolean(gateQuery.data?.canAccess);

  useCollectiveReadingCommentsRealtime(
    bookId,
    Boolean(userId && bookId && gateCanAccess),
    userId,
  );

  const commentsQuery = useQuery({
    queryKey: getCollectiveReadingCommentsQueryKey(bookId),
    queryFn: () => service.listByBookId(bookId, userId),
    enabled: Boolean(userId && bookId && gateQuery.data?.canAccess),
  });

  const scheduleChapter = useMemo(
    () => getCurrentScheduleChapterInfo(schedule),
    [schedule],
  );

  const addComment = useMutation({
    mutationFn: (content: string) => service.createComment(bookId, content),
    onSuccess: (data) => {
      queryClient.setQueryData<CollectiveReadingCommentDomain[]>(
        getCollectiveReadingCommentsQueryKey(bookId),
        (old) => {
          const list = old ?? [];
          if (list.some((c) => c.id === data.id)) return list;
          return [data, ...list];
        },
      );
      setDraft("");
    },
  });

  const handleSubmitComment = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed || addComment.isPending) return;
    addComment.mutate(trimmed);
  }, [addComment, draft]);

  const deleteComment = useMutation({
    mutationFn: (commentId: string) => service.removeComment(commentId),
    onSuccess: (_, commentId) => {
      queryClient.setQueryData<CollectiveReadingCommentDomain[]>(
        getCollectiveReadingCommentsQueryKey(bookId),
        (old) => (old ?? []).filter((c) => c.id !== commentId),
      );
      setDeleteCommentOpen(false);
      setDeleteCommentId(null);
    },
  });

  const handleOpenDeleteComment = useCallback((commentId: string) => {
    setDeleteCommentId(commentId);
    setDeleteCommentOpen(true);
  }, []);

  const handleDeleteCommentOpenChange = useCallback((open: boolean) => {
    setDeleteCommentOpen(open);
    if (!open) setDeleteCommentId(null);
  }, []);

  const handleDraftChange = useCallback((value: string) => {
    setDraft(value);
  }, []);

  const {
    mutate: mutateCommentReaction,
    isPending: isCommentReactionPending,
    variables: commentReactionVariables,
  } = useMutation({
    mutationFn: async ({
      commentId,
      value,
    }: {
      commentId: string;
      value: "like" | "dislike";
    }) => {
      const list =
        queryClient.getQueryData<CollectiveReadingCommentDomain[]>(
          getCollectiveReadingCommentsQueryKey(bookId),
        ) ?? [];
      const c = list.find((x) => x.id === commentId);
      const next = c?.userReaction === value ? null : value;
      return service.setCommentReaction(commentId, next);
    },
    onSuccess: (data) => {
      queryClient.setQueryData<CollectiveReadingCommentDomain[]>(
        getCollectiveReadingCommentsQueryKey(bookId),
        (old) =>
          (old ?? []).map((c) =>
            c.id === data.commentId
              ? {
                  ...c,
                  likeCount: data.likeCount,
                  dislikeCount: data.dislikeCount,
                  userReaction: data.userReaction,
                }
              : c,
          ),
      );
    },
  });

  const handleToggleReaction = useCallback(
    (commentId: string, value: "like" | "dislike") => {
      if (!userId || isCommentReactionPending) return;
      mutateCommentReaction({ commentId, value });
    },
    [isCommentReactionPending, mutateCommentReaction, userId],
  );

  const confirmDeleteComment = useCallback(
    (commentId: string) => deleteComment.mutateAsync(commentId),
    [deleteComment],
  );

  const reactionPendingCommentId = isCommentReactionPending
    ? commentReactionVariables?.commentId ?? null
    : null;

  return useMemo(
    () => ({
      userId,
      gate: gateQuery.data,
      gateLoading: gateQuery.isLoading,
      gateError: gateQuery.isError,
      comments: commentsQuery.data ?? [],
      commentsLoading: commentsQuery.isLoading,
      commentsError: commentsQuery.isError,
      scheduleLoading: isLoadingSchedule,
      scheduleChapter,
      draft,
      handleDraftChange,
      handleSubmitComment,
      isSubmittingComment: addComment.isPending,
      deleteCommentId,
      deleteCommentOpen,
      handleDeleteCommentOpenChange,
      handleOpenDeleteComment,
      confirmDeleteComment,
      deleteCommentPending: deleteComment.isPending,
      handleToggleReaction,
      reactionPendingCommentId,
    }),
    [
      userId,
      gateQuery.data,
      gateQuery.isLoading,
      gateQuery.isError,
      commentsQuery.data,
      commentsQuery.isLoading,
      commentsQuery.isError,
      isLoadingSchedule,
      scheduleChapter,
      draft,
      handleDraftChange,
      handleSubmitComment,
      addComment.isPending,
      deleteCommentId,
      deleteCommentOpen,
      handleDeleteCommentOpenChange,
      handleOpenDeleteComment,
      confirmDeleteComment,
      deleteComment.isPending,
      handleToggleReaction,
      reactionPendingCommentId,
    ],
  );
}
