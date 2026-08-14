import { createClient } from "@/lib/supabase/client";
import {
  canUserParticipateInBook,
  isCollectiveReadingBook,
} from "@/lib/security/bookParticipation";
import { apiJson } from "@/lib/api/clientJsonFetch";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";
import { formatReaderIds } from "@/utils/formatters";

import {
  CollectiveReadingCommentMapper,
  type CollectiveReadingCommentReactionStats,
  type CollectiveReadingCommentRow,
} from "./mappers/collectiveReadingComment.mapper";
import type {
  CollectiveReadingCommentDomain,
  CollectiveReadingCommentUserReaction,
  CollectiveReadingGateResult,
} from "../types/collectiveReading.types";

export type CollectiveReadingCommentReactionResult = {
  commentId: string;
  likeCount: number;
  dislikeCount: number;
  userReaction: CollectiveReadingCommentUserReaction;
};

export class CollectiveReadingCommentsService {
  private supabase = createClient();

  private buildReactionStatsByCommentId(
    reactionRows: {
      comment_id: string;
      user_id: string;
      reaction: string;
    }[],
    viewerUserId: string | undefined,
  ): Map<string, CollectiveReadingCommentReactionStats> {
    const aggregated = new Map<string, CollectiveReadingCommentReactionStats>();

    for (const r of reactionRows) {
      let cur = aggregated.get(r.comment_id);
      if (!cur) {
        cur = {
          likeCount: 0,
          dislikeCount: 0,
          userReaction: null,
        };
        aggregated.set(r.comment_id, cur);
      }
      if (r.reaction === "like") cur.likeCount += 1;
      else if (r.reaction === "dislike") cur.dislikeCount += 1;
      if (viewerUserId && r.user_id === viewerUserId) {
        cur.userReaction =
          r.reaction === "like" || r.reaction === "dislike"
            ? r.reaction
            : null;
      }
    }

    return aggregated;
  }

  async checkAccess(
    bookId: string,
    userId: string,
  ): Promise<CollectiveReadingGateResult> {
    try {
      const { data, error } = await this.supabase
        .from("books")
        .select("title,readers,chosen_by,user_id")
        .eq("id", bookId)
        .maybeSingle();

      if (error) {
        throw new RepositoryError(
          "Falha ao validar leitura coletiva",
          undefined,
          undefined,
          error,
          { bookId },
        );
      }
      if (!data) {
        return {
          canAccess: false,
          bookTitle: "",
          participantsDisplay: "",
        };
      }
      const readers = data.readers as string[] | null;
      const ok =
        isCollectiveReadingBook(readers) &&
        canUserParticipateInBook(userId, {
          user_id: data.user_id,
          chosen_by: data.chosen_by,
          readers,
        });
      const readerIds = [...new Set(readers ?? [])];
      let participantsDisplay = "";
      if (readerIds.length > 0) {
        const { data: userRows, error: usersErr } = await this.supabase
          .from("users")
          .select("id, display_name")
          .in("id", readerIds);
        if (usersErr) {
          ErrorHandler.log(
            ErrorHandler.normalize(usersErr, {
              service: "CollectiveReadingCommentsService",
              method: "checkAccess.usersLookup",
              bookId,
            }),
          );
        }
        participantsDisplay =
          formatReaderIds(readers, userRows ?? []) ?? "";
      }
      return {
        canAccess: ok,
        bookTitle: data.title ?? "",
        participantsDisplay,
      };
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "CollectiveReadingCommentsService",
        method: "checkAccess",
        bookId,
        userId,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }

  async listByBookId(
    bookId: string,
    viewerUserId?: string,
  ): Promise<CollectiveReadingCommentDomain[]> {
    try {
      const { data: rows, error } = await this.supabase
        .from("collective_reading_comments")
        .select("*")
        .eq("book_id", bookId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new RepositoryError(
          "Falha ao buscar comentários",
          undefined,
          undefined,
          error,
          { bookId },
        );
      }
      if (!rows?.length) return [];

      const commentIds = rows.map((r) => r.id as string);
      const { data: reactionRows, error: reErr } = await this.supabase
        .from("collective_reading_comment_reactions")
        .select("comment_id, user_id, reaction")
        .eq("book_id", bookId)
        .in("comment_id", commentIds);

      if (reErr) {
        throw new RepositoryError(
          "Falha ao buscar reações dos comentários",
          undefined,
          undefined,
          reErr,
          { bookId },
        );
      }

      const statsByCommentId = this.buildReactionStatsByCommentId(
        reactionRows ?? [],
        viewerUserId,
      );

      const userIds = [...new Set(rows.map((r) => r.user_id as string))];
      const { data: users, error: usersErr } = await this.supabase
        .from("users")
        .select("id, display_name")
        .in("id", userIds);

      if (usersErr) {
        throw new RepositoryError(
          "Falha ao resolver autores dos comentários",
          undefined,
          undefined,
          usersErr,
          { bookId },
        );
      }

      const nameById = new Map(
        (users ?? []).map((u) => [u.id as string, u.display_name as string]),
      );

      return (rows as CollectiveReadingCommentRow[]).map((row) =>
        CollectiveReadingCommentMapper.toDomain(
          row,
          nameById.get(row.user_id) ?? "Leitor",
          statsByCommentId.get(row.id),
        ),
      );
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "CollectiveReadingCommentsService",
        method: "listByBookId",
        bookId,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }

  async createComment(
    bookId: string,
    content: string,
  ): Promise<CollectiveReadingCommentDomain> {
    try {
      const rowRaw = await apiJson<CollectiveReadingCommentRow>(
        "/api/collective-reading-comments",
        {
          method: "POST",
          body: JSON.stringify({ bookId, content }),
        },
      );
      const { data: userRow, error: userErr } = await this.supabase
        .from("users")
        .select("display_name")
        .eq("id", rowRaw.user_id)
        .maybeSingle();

      if (userErr) {
        throw new RepositoryError(
          "Falha ao resolver autor do comentário",
          undefined,
          undefined,
          userErr,
          { bookId },
        );
      }

      return CollectiveReadingCommentMapper.toDomain(
        rowRaw,
        userRow?.display_name ?? "Leitor",
      );
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "CollectiveReadingCommentsService",
        method: "createComment",
        bookId,
        content,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }

  async removeComment(commentId: string): Promise<void> {
    try {
      await apiJson<{ ok: true }>(
        `/api/collective-reading-comments/${encodeURIComponent(commentId)}`,
        { method: "DELETE" },
      );
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "CollectiveReadingCommentsService",
        method: "removeComment",
        commentId,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }

  async setCommentReaction(
    commentId: string,
    reaction: CollectiveReadingCommentUserReaction,
  ): Promise<CollectiveReadingCommentReactionResult> {
    try {
      return await apiJson<CollectiveReadingCommentReactionResult>(
        "/api/collective-reading-comment-reactions",
        {
          method: "POST",
          body: JSON.stringify({ commentId, reaction }),
        },
      );
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "CollectiveReadingCommentsService",
        method: "setCommentReaction",
        commentId,
        reaction,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }
}
