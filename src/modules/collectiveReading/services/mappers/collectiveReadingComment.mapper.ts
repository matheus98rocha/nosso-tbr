import type {
  CollectiveReadingCommentDomain,
  CollectiveReadingCommentUserReaction,
} from "../../types/collectiveReading.types";

export type CollectiveReadingCommentRow = {
  id: string;
  book_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export type CollectiveReadingCommentReactionStats = {
  likeCount: number;
  dislikeCount: number;
  userReaction: CollectiveReadingCommentUserReaction;
};

export class CollectiveReadingCommentMapper {
  static toDomain(
    row: CollectiveReadingCommentRow,
    authorDisplayName: string,
    stats?: CollectiveReadingCommentReactionStats,
  ): CollectiveReadingCommentDomain {
    return {
      id: row.id,
      bookId: row.book_id,
      userId: row.user_id,
      content: row.content,
      createdAt: row.created_at,
      authorDisplayName,
      likeCount: stats?.likeCount ?? 0,
      dislikeCount: stats?.dislikeCount ?? 0,
      userReaction: stats?.userReaction ?? null,
    };
  }
}
