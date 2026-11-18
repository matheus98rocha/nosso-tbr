import type { Status } from "@/types/books.types";

import type {
  ReviewComment,
  ReviewCursor,
  ReviewFeedItem,
  ReviewFeedPage,
  ReviewMine,
  ReviewReaction,
} from "../../types";

const STATUSES: Status[] = [
  "reading",
  "finished",
  "not_started",
  "planned",
  "paused",
  "abandoned",
];

export type ReviewFeedRow = {
  id: string;
  user_id: string;
  author_display_name: string | null;
  author_avatar_seed: string | null;
  book_id: string;
  book_title: string | null;
  book_image_url: string | null;
  book_authors: string | null;
  stars: number;
  content: string;
  reading_status: string;
  created_at: string;
  updated_at: string;
  like_count: number | string;
  dislike_count: number | string;
  comment_count: number | string;
  user_reaction: string | null;
};

function asStatus(value: string): Status {
  if (STATUSES.includes(value as Status)) return value as Status;
  return "not_started";
}

function asReaction(value: string | null): ReviewReaction | null {
  if (value === "like" || value === "dislike") return value;
  return null;
}

function count(value: number | string) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

export function mapReviewFeedRow(
  row: ReviewFeedRow,
  viewerUserId: string | null,
): ReviewFeedItem {
  const createdAt = row.created_at;
  const updatedAt = row.updated_at;
  return {
    id: row.id,
    userId: row.user_id,
    authorDisplayName: row.author_display_name?.trim() || "Leitor",
    authorAvatarSeed: row.author_avatar_seed,
    bookId: row.book_id,
    bookTitle: row.book_title?.trim() || "Livro",
    bookImageUrl: row.book_image_url,
    bookAuthors: row.book_authors?.trim() || "",
    stars: Number(row.stars),
    content: row.content,
    readingStatus: asStatus(row.reading_status),
    createdAt,
    updatedAt,
    edited: new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 1000,
    likeCount: count(row.like_count),
    dislikeCount: count(row.dislike_count),
    commentCount: count(row.comment_count),
    userReaction: asReaction(row.user_reaction),
    isOwn: viewerUserId !== null && row.user_id === viewerUserId,
  };
}

export function mapReviewFeedPage(
  rows: ReviewFeedRow[],
  viewerUserId: string | null,
  limit: number,
): ReviewFeedPage {
  const reviews = rows.map((row) => mapReviewFeedRow(row, viewerUserId));
  const last = reviews.at(-1);
  const nextCursor: ReviewCursor | null =
    reviews.length === limit && last
      ? { createdAt: last.createdAt, id: last.id }
      : null;
  return { reviews, nextCursor };
}

type UserEmbed = {
  display_name?: string | null;
  avatar_seed?: string | null;
};

export type ReviewCommentRow = {
  id: string;
  review_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  users?: UserEmbed | UserEmbed[] | null;
};

function embeddedUser(value: ReviewCommentRow["users"]) {
  const row = Array.isArray(value) ? value[0] : value;
  return {
    displayName: row?.display_name?.trim() || "Leitor",
    avatarSeed: row?.avatar_seed ?? null,
  };
}

export function mapReviewComment(row: ReviewCommentRow): ReviewComment {
  const author = embeddedUser(row.users);
  return {
    id: row.id,
    reviewId: row.review_id,
    userId: row.user_id,
    parentId: row.parent_id,
    content: row.content,
    createdAt: row.created_at,
    authorDisplayName: author.displayName,
    authorAvatarSeed: author.avatarSeed,
  };
}

export function mapReviewMine(row: {
  id: string;
  stars: number;
  content: string;
  reading_status: string;
}): ReviewMine {
  return {
    id: row.id,
    stars: Number(row.stars),
    content: row.content,
    readingStatus: asStatus(row.reading_status),
  };
}
