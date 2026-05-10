import type { QueryClient } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

import {
  CollectiveReadingCommentMapper,
  type CollectiveReadingCommentRow,
} from "../services/mappers/collectiveReadingComment.mapper";
import type { CollectiveReadingCommentDomain } from "../types/collectiveReading.types";
import { getCollectiveReadingCommentsQueryKey } from "../utils/collectiveReadingCommentQueryKey";

async function refreshCommentReactionStats(
  supabase: ReturnType<typeof createClient>,
  queryClient: QueryClient,
  queryKey: ReturnType<typeof getCollectiveReadingCommentsQueryKey>,
  commentId: string,
  viewerUserId: string | undefined,
) {
  const { data, error } = await supabase
    .from("collective_reading_comment_reactions")
    .select("user_id, reaction")
    .eq("comment_id", commentId);

  if (error || !data) return;

  let likeCount = 0;
  let dislikeCount = 0;
  let userReaction: CollectiveReadingCommentDomain["userReaction"] = null;

  for (const r of data) {
    if (r.reaction === "like") likeCount += 1;
    else if (r.reaction === "dislike") dislikeCount += 1;
    if (viewerUserId && r.user_id === viewerUserId) {
      userReaction =
        r.reaction === "like" || r.reaction === "dislike"
          ? r.reaction
          : null;
    }
  }

  queryClient.setQueryData<CollectiveReadingCommentDomain[]>(
    queryKey,
    (old) => {
      if (!old) return old;
      return old.map((c) =>
        c.id === commentId
          ? { ...c, likeCount, dislikeCount, userReaction }
          : c,
      );
    },
  );
}

export function useCollectiveReadingCommentsRealtime(
  bookId: string,
  enabled: boolean,
  viewerUserId: string | undefined,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !bookId) return;

    const supabase = createClient();
    const queryKey = getCollectiveReadingCommentsQueryKey(bookId);

    const mergeComment = (domain: CollectiveReadingCommentDomain) => {
      queryClient.setQueryData<CollectiveReadingCommentDomain[]>(
        queryKey,
        (old) => {
          const list = old ?? [];
          if (list.some((c) => c.id === domain.id)) return list;
          return [domain, ...list];
        },
      );
    };

    const removeCommentById = (commentId: string) => {
      queryClient.setQueryData<CollectiveReadingCommentDomain[]>(
        queryKey,
        (old) => (old ?? []).filter((c) => c.id !== commentId),
      );
    };

    const channel = supabase
      .channel(`collective-reading-comments:${bookId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "collective_reading_comments",
          filter: `book_id=eq.${bookId}`,
        },
        async (payload) => {
          const row = payload.new as CollectiveReadingCommentRow | null;
          if (!row?.id) return;
          const { data: userRow } = await supabase
            .from("users")
            .select("display_name")
            .eq("id", row.user_id)
            .maybeSingle();
          const domain = CollectiveReadingCommentMapper.toDomain(
            row,
            userRow?.display_name ?? "Leitor",
          );
          mergeComment(domain);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "collective_reading_comments",
          filter: `book_id=eq.${bookId}`,
        },
        (payload) => {
          const oldRow = payload.old as { id?: string } | null;
          if (!oldRow?.id) return;
          removeCommentById(oldRow.id);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "collective_reading_comment_reactions",
          filter: `book_id=eq.${bookId}`,
        },
        async (payload) => {
          const row = payload.new as { comment_id?: string } | null;
          if (!row?.comment_id) return;
          await refreshCommentReactionStats(
            supabase,
            queryClient,
            queryKey,
            row.comment_id,
            viewerUserId,
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "collective_reading_comment_reactions",
          filter: `book_id=eq.${bookId}`,
        },
        async (payload) => {
          const row = payload.new as { comment_id?: string } | null;
          if (!row?.comment_id) return;
          await refreshCommentReactionStats(
            supabase,
            queryClient,
            queryKey,
            row.comment_id,
            viewerUserId,
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "collective_reading_comment_reactions",
          filter: `book_id=eq.${bookId}`,
        },
        async (payload) => {
          const row = payload.old as { comment_id?: string } | null;
          if (!row?.comment_id) return;
          await refreshCommentReactionStats(
            supabase,
            queryClient,
            queryKey,
            row.comment_id,
            viewerUserId,
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [bookId, enabled, queryClient, viewerUserId]);
}
