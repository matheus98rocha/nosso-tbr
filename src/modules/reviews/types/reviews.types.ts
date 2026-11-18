import type { Status } from "@/types/books.types";

export type ReviewScope = "all" | "following" | "mine";

export type ReviewTab = "geral" | "seguindo" | "minhas";

export type ReviewReaction = "like" | "dislike";

export type ReviewComposerMode = "finish" | "compose";

export type ReviewCursor = {
  createdAt: string;
  id: string;
};

export type ReviewFeedItem = {
  id: string;
  userId: string;
  authorDisplayName: string;
  authorAvatarSeed: string | null;
  bookId: string;
  bookTitle: string;
  bookImageUrl: string | null;
  bookAuthors: string;
  bookIsSolo: boolean;
  stars: number;
  content: string;
  readingStatus: Status;
  createdAt: string;
  updatedAt: string;
  edited: boolean;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  userReaction: ReviewReaction | null;
  isOwn: boolean;
};

export type ReviewFeedPage = {
  reviews: ReviewFeedItem[];
  nextCursor: ReviewCursor | null;
};

export type ReviewComment = {
  id: string;
  reviewId: string;
  userId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  authorDisplayName: string;
  authorAvatarSeed: string | null;
  pending?: boolean;
};

export type ReviewComposerBook = {
  id: string;
  title: string;
  author: string | null;
  imageUrl: string | null;
  status: Status;
  isSolo: boolean;
};

export type ReviewMine = {
  id: string;
  stars: number;
  content: string;
  readingStatus: Status;
};

export type ReviewBookOption = {
  id: string;
  title: string;
  author: string | null;
  imageUrl: string | null;
  status: Status;
  isSolo: boolean;
  hasReview: boolean;
};

export type ReviewBookPickerProps = {
  onSelect: (book: ReviewComposerBook) => void;
};

export type ReviewBookStatusBadgeProps = {
  status: Status;
};

export type CurrentBookStatusPresentation = {
  label: string;
  colorClass: string;
  dotClass: string;
};

export type ReviewStatusPresentation = {
  label: string;
  badgeClassName: string;
  dotClassName: string;
};

export type UpsertReviewResult = {
  published: boolean;
  reviewId: string | null;
  stars: number;
};

export type ReviewReactionResult = {
  reviewId: string;
  likeCount: number;
  dislikeCount: number;
  userReaction: ReviewReaction | null;
};
