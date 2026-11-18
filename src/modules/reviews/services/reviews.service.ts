import { apiJson } from "@/lib/api/clientJsonFetch";
import { canUserParticipateInBook } from "@/lib/security/bookParticipation";
import { createClient } from "@/lib/supabase/client";
import { BookMapper } from "@/services/books/books.mapper";
import type { Status } from "@/types/books.types";

import { REVIEW_PAGE_SIZE } from "../constants";
import type {
  ReviewBookOption,
  ReviewComment,
  ReviewCursor,
  ReviewFeedPage,
  ReviewMine,
  ReviewReaction,
  ReviewReactionResult,
  ReviewScope,
  UpsertReviewResult,
} from "../types";
import {
  mapReviewComment,
  mapReviewFeedPage,
  mapReviewMine,
  type ReviewCommentRow,
  type ReviewFeedRow,
} from "./mappers/review.mapper";

const STATUSES: Status[] = [
  "reading",
  "finished",
  "not_started",
  "planned",
  "paused",
  "abandoned",
];

type BookOptionRow = {
  id: string;
  title: string;
  status: string | null;
  image_url: string | null;
  readers: string[] | null;
  chosen_by: string | null;
  user_id: string | null;
  author?: { name?: string | null } | { name?: string | null }[] | null;
};

function authorName(author: BookOptionRow["author"]) {
  const row = Array.isArray(author) ? author[0] : author;
  const name = row?.name?.trim();
  return name || null;
}

function asStatus(value: string | null): Status {
  if (value && STATUSES.includes(value as Status)) return value as Status;
  return "not_started";
}

export class ReviewsService {
  private supabase = createClient();

  async listFeed(
    scope: ReviewScope,
    cursor: ReviewCursor | null,
    viewerUserId: string | null,
    limit = REVIEW_PAGE_SIZE,
  ): Promise<ReviewFeedPage> {
    const { data, error } = await this.supabase.rpc("get_review_feed", {
      p_scope: scope,
      p_limit: limit,
      p_before_created_at: cursor?.createdAt ?? null,
      p_before_id: cursor?.id ?? null,
    });

    if (error) {
      throw new Error(error.message);
    }

    return mapReviewFeedPage((data ?? []) as ReviewFeedRow[], viewerUserId, limit);
  }

  async listMyBookIds(): Promise<string[]> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await this.supabase
      .from("book_reviews")
      .select("book_id")
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => row.book_id as string);
  }

  async getMineByBookId(bookId: string): Promise<{
    review: ReviewMine | null;
    ratingStars: number | null;
    bookStatus: Status | null;
  }> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) return { review: null, ratingStars: null, bookStatus: null };

    const [reviewResult, ratingResult, bookResult] = await Promise.all([
      this.supabase
        .from("book_reviews")
        .select("id, stars, content, reading_status")
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .maybeSingle(),
      this.supabase
        .from("book_reading_ratings")
        .select("stars")
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .maybeSingle(),
      this.supabase.from("books").select("status").eq("id", bookId).maybeSingle(),
    ]);

    if (reviewResult.error) throw new Error(reviewResult.error.message);
    if (ratingResult.error) throw new Error(ratingResult.error.message);
    if (bookResult.error) throw new Error(bookResult.error.message);

    return {
      review: reviewResult.data
        ? mapReviewMine(
            reviewResult.data as {
              id: string;
              stars: number;
              content: string;
              reading_status: string;
            },
          )
        : null,
      ratingStars:
        typeof ratingResult.data?.stars === "number" ? ratingResult.data.stars : null,
      bookStatus: bookResult.data ? asStatus(bookResult.data.status as string | null) : null,
    };
  }

  async listParticipatingBooks(reviewedIds: string[]): Promise<ReviewBookOption[]> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) return [];

    const reviewed = new Set(reviewedIds);
    const { data, error } = await this.supabase
      .from("books")
      .select(
        "id, title, status, image_url, readers, chosen_by, user_id, author:authors!books_author_id_fkey(name)",
      )
      .or(`chosen_by.eq.${user.id},user_id.eq.${user.id},readers.cs.{${user.id}}`)
      .order("title", { ascending: true })
      .limit(200);

    if (error) throw new Error(error.message);

    return ((data ?? []) as BookOptionRow[])
      .filter((row) =>
        canUserParticipateInBook(user.id, {
          user_id: row.user_id,
          chosen_by: row.chosen_by,
          readers: row.readers,
        }),
      )
      .map((row) => {
        const readerIds = row.readers ?? [];
        return {
          id: row.id,
          title: row.title,
          author: authorName(row.author),
          imageUrl: row.image_url,
          status: asStatus(row.status),
          isSolo: BookMapper.isSoloBook({
            chosen_by: row.chosen_by ?? "",
            readerIds,
          }),
          hasReview: reviewed.has(row.id),
        };
      });
  }

  async listComments(reviewId: string): Promise<ReviewComment[]> {
    const { data, error } = await this.supabase
      .from("book_review_comments")
      .select(
        "id, review_id, user_id, parent_id, content, created_at, users(display_name, avatar_seed)",
      )
      .eq("review_id", reviewId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return ((data ?? []) as ReviewCommentRow[]).map(mapReviewComment);
  }

  upsert(input: { bookId: string; stars: number; content: string }) {
    return apiJson<UpsertReviewResult>("/api/reviews", {
      method: "PUT",
      body: JSON.stringify(input),
    });
  }

  deleteReview(reviewId: string) {
    return apiJson<{ ok: true }>(`/api/reviews/${reviewId}`, { method: "DELETE" });
  }

  setReaction(reviewId: string, reaction: ReviewReaction | null) {
    return apiJson<ReviewReactionResult>("/api/review-reactions", {
      method: "POST",
      body: JSON.stringify({ reviewId, reaction }),
    });
  }

  createComment(input: {
    reviewId: string;
    content: string;
    parentId?: string | null;
  }) {
    return apiJson<ReviewCommentRow>("/api/review-comments", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  deleteComment(commentId: string) {
    return apiJson<{ ok: true }>(`/api/review-comments/${commentId}`, {
      method: "DELETE",
    });
  }
}
