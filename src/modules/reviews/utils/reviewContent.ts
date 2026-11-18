import { REVIEW_MAX_LENGTH, REVIEW_WARN_LENGTH } from "../constants";
import type { ReviewComposerMode } from "../types";
import type { Status } from "@/types/books.types";

export type ReviewContentTone = "ok" | "warn" | "limit";

export function reviewContentState(value: string) {
  const length = value.length;
  const trimmed = value.trim();
  const tone: ReviewContentTone =
    length >= REVIEW_MAX_LENGTH ? "limit" : length >= REVIEW_WARN_LENGTH ? "warn" : "ok";

  return {
    length,
    trimmed,
    tone,
    counter: `${length}/${REVIEW_MAX_LENGTH}`,
  };
}

export function canSubmitReview(input: {
  mode: ReviewComposerMode;
  stars: number | null;
  content: string;
  bookStatus: Status;
}) {
  const starsOk = input.stars !== null && input.stars >= 1 && input.stars <= 5;
  const text = input.content.trim();
  const publishesReview = starsOk && text.length > 0;
  const savesRatingOnly =
    input.mode === "finish" &&
    starsOk &&
    text.length === 0 &&
    input.bookStatus === "finished";

  return {
    publishesReview,
    savesRatingOnly,
    ok: publishesReview || savesRatingOnly,
  };
}
