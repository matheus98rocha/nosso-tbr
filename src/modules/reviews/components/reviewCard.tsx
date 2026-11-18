"use client";

import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreHorizontal, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { BookCover } from "@/components/bookCover";
import { ConfirmDialog } from "@/components/confirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getMemberProfilePath } from "@/lib/routes/community";
import { ProfileAvatar } from "@/modules/profile/components/ProfileAvatar";

import { REVIEW_PREVIEW_LENGTH, REVIEWS_COPY } from "../constants";
import { useDeleteReview } from "../hooks";
import { openReviewForBook } from "../stores";
import type { ReviewFeedItem, ReviewReaction } from "../types";
import { readerInitials, reviewStatusLabel } from "../utils";
import ReviewActionBar from "./reviewActionBar";
import ReviewCommentsSheet from "./reviewCommentsSheet";

type ReviewCardProps = {
  review: ReviewFeedItem;
  onReact: (reviewId: string, reaction: ReviewReaction) => void;
};

export default function ReviewCard({ review, onReact }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const remove = useDeleteReview();
  const status = reviewStatusLabel(review.readingStatus);
  const long = review.content.length > REVIEW_PREVIEW_LENGTH;
  const when = formatDistanceToNow(new Date(review.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <article className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <header className="flex items-start gap-3">
        <Link href={getMemberProfilePath(review.userId)} className="shrink-0 rounded-full">
          <ProfileAvatar
            initials={readerInitials(review.authorDisplayName)}
            avatarSeed={review.authorAvatarSeed}
            size="sm"
            alt=""
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={getMemberProfilePath(review.userId)}
            className="font-medium hover:underline"
          >
            {review.authorDisplayName}
          </Link>
          <p className="text-xs text-muted-foreground">
            {when}
            {review.edited ? ` · ${REVIEWS_COPY.edited}` : ""}
          </p>
        </div>
        {review.isOwn ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                aria-label={REVIEWS_COPY.menu}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() =>
                  openReviewForBook({
                    id: review.bookId,
                    title: review.bookTitle,
                    author: review.bookAuthors || null,
                    imageUrl: review.bookImageUrl,
                    status: review.readingStatus,
                    isSolo: false,
                  })
                }
              >
                {REVIEWS_COPY.edit}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setDeleteOpen(true)}
              >
                {REVIEWS_COPY.deleteReview}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </header>

      <div className="mt-4 flex gap-3">
        <BookCover
          src={review.bookImageUrl}
          alt=""
          width={48}
          height={72}
          containerClassName="relative h-[72px] w-12 shrink-0 overflow-hidden rounded-md"
        />
        <div className="min-w-0">
          <p className="font-medium leading-snug">{review.bookTitle}</p>
          {review.bookAuthors ? (
            <p className="text-sm text-muted-foreground">{review.bookAuthors}</p>
          ) : null}
          <Badge className={cn("mt-2 gap-1.5 border-0", status.badgeClassName)}>
            <span className={cn("size-1.5 rounded-full", status.dotClassName)} />
            {status.label}
          </Badge>
        </div>
      </div>

      <div
        className="mt-3 flex items-center gap-0.5 text-amber-500"
        aria-label={`${review.stars} de 5 estrelas`}
      >
        {[1, 2, 3, 4, 5].map((step) => (
          <Star
            key={step}
            className={cn("size-4", step <= review.stars ? "fill-current" : "text-muted-foreground/40")}
            aria-hidden
          />
        ))}
      </div>

      <p
        className={cn(
          "mt-3 whitespace-pre-wrap text-sm leading-relaxed",
          !expanded && long && "line-clamp-4",
        )}
      >
        {review.content}
      </p>
      {long ? (
        <button
          type="button"
          className="mt-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? REVIEWS_COPY.readLess : REVIEWS_COPY.readMore}
        </button>
      ) : null}

      <div className="mt-3">
        <ReviewActionBar
          review={review}
          onReact={onReact}
          onOpenComments={() => setCommentsOpen(true)}
        />
      </div>

      <ReviewCommentsSheet
        reviewId={review.id}
        reviewAuthorId={review.userId}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        id={review.id}
        title={REVIEWS_COPY.deleteReviewTitle}
        description={REVIEWS_COPY.deleteReviewBody}
        buttonLabel={REVIEWS_COPY.deleteReview}
        queryKeyToInvalidate="reviews"
        onConfirm={async (id) => {
          await remove.mutateAsync(id);
        }}
      />
    </article>
  );
}
