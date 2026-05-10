export type CollectiveReadingCommentUserReaction =
  | "like"
  | "dislike"
  | null;

export type CollectiveReadingCommentDomain = {
  id: string;
  bookId: string;
  userId: string;
  content: string;
  createdAt: string;
  authorDisplayName: string;
  likeCount: number;
  dislikeCount: number;
  userReaction: CollectiveReadingCommentUserReaction;
};

export type CollectiveReadingGateResult = {
  canAccess: boolean;
  bookTitle: string;
  participantsDisplay: string;
};

export type ClientCollectiveReadingProps = {
  id: string;
  title: string;
};

export type CollectiveReadingCommentListProps = {
  comments: CollectiveReadingCommentDomain[];
  isLoading: boolean;
  currentUserId: string | undefined;
  reactionPendingCommentId: string | null;
  onRequestDelete: (commentId: string) => void;
  onToggleReaction: (
    commentId: string,
    value: "like" | "dislike",
  ) => void;
};

export type CurrentScheduleChapterInfo =
  | {
      kind: "active";
      dateLabel: string;
      chaptersLabel: string;
    }
  | {
      kind: "completed";
      lastDateLabel: string;
      lastChaptersLabel: string;
    };
