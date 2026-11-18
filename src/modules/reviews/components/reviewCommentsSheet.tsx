"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

import { ConfirmDialog } from "@/components/confirmDialog";
import { ProfileAvatar } from "@/modules/profile/components/ProfileAvatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { REVIEWS_COPY } from "../constants";
import { useReviewComments } from "../hooks";
import { readerInitials, reviewContentState } from "../utils";

type ReviewCommentsSheetProps = {
  reviewId: string | null;
  reviewAuthorId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function useSheetSide() {
  const [side, setSide] = useState<"bottom" | "right">("bottom");

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const apply = () => setSide(media.matches ? "right" : "bottom");
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return side;
}

export default function ReviewCommentsSheet({
  reviewId,
  reviewAuthorId,
  open,
  onOpenChange,
}: ReviewCommentsSheetProps) {
  const side = useSheetSide();
  const thread = useReviewComments(open ? reviewId : null);
  const { comments } = thread;
  const [draft, setDraft] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const content = reviewContentState(draft);

  const repliesByParent = useMemo(() => {
    const grouped = new Map<string, typeof comments>();
    for (const comment of comments) {
      if (!comment.parentId) continue;
      const list = grouped.get(comment.parentId) ?? [];
      list.push(comment);
      grouped.set(comment.parentId, list);
    }
    return grouped;
  }, [comments]);

  const roots = comments.filter((comment) => !comment.parentId);

  const publish = () => {
    if (!content.trimmed || thread.isPublishing) return;
    thread.publish(content.trimmed);
    setDraft("");
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side={side}
          className={cn(
            "flex flex-col gap-0 p-0",
            side === "bottom" ? "h-[min(85dvh,40rem)]" : "w-full sm:max-w-md",
          )}
        >
          <SheetHeader className="border-b border-border/70">
            <SheetTitle>{REVIEWS_COPY.comments}</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {thread.isLoading ? (
              <div className="space-y-3" aria-busy="true">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : null}
            {thread.isError ? (
              <div className="space-y-3 text-sm">
                <p>{REVIEWS_COPY.commentsError}</p>
                <Button type="button" variant="outline" onClick={() => void thread.refetch()}>
                  {REVIEWS_COPY.retry}
                </Button>
              </div>
            ) : null}
            {!thread.isLoading && !thread.isError && roots.length === 0 ? (
              <p className="text-sm text-muted-foreground">{REVIEWS_COPY.noComments}</p>
            ) : null}
            <ul className="space-y-4">
              {roots.map((comment) => (
                <li key={comment.id} className={cn(comment.pending && "opacity-60")}>
                  <CommentRow
                    comment={comment}
                    canDelete={
                      comment.userId === thread.currentUserId ||
                      reviewAuthorId === thread.currentUserId
                    }
                    onReply={() =>
                      thread.setReplyTo({
                        parentId: comment.id,
                        name: comment.authorDisplayName,
                      })
                    }
                    onDelete={() => setPendingDeleteId(comment.id)}
                  />
                  <ul className="mt-3 space-y-3 border-l border-border/80 pl-3">
                    {(repliesByParent.get(comment.id) ?? []).map((reply) => (
                      <li key={reply.id} className={cn(reply.pending && "opacity-60")}>
                        <CommentRow
                          comment={reply}
                          canDelete={
                            reply.userId === thread.currentUserId ||
                            reviewAuthorId === thread.currentUserId
                          }
                          onReply={() =>
                            thread.setReplyTo({
                              parentId: comment.id,
                              name: reply.authorDisplayName,
                            })
                          }
                          onDelete={() => setPendingDeleteId(reply.id)}
                        />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
          <form
            className="space-y-2 border-t border-border/70 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              publish();
            }}
          >
            {thread.replyTo ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {REVIEWS_COPY.replyingTo} {thread.replyTo.name}
                </span>
                <button
                  type="button"
                  className="inline-flex size-5 items-center justify-center rounded-full hover:bg-muted"
                  aria-label="Cancelar resposta"
                  onClick={() => thread.setReplyTo(null)}
                >
                  <X className="size-3" />
                </button>
              </p>
            ) : null}
            <Textarea
              value={draft}
              maxLength={500}
              rows={3}
              placeholder={
                thread.replyTo ? REVIEWS_COPY.replyPlaceholder : REVIEWS_COPY.commentPlaceholder
              }
              aria-label={REVIEWS_COPY.commentPlaceholder}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  publish();
                }
              }}
            />
            <div className="flex items-center justify-between gap-3">
              <span
                className={cn(
                  "text-xs tabular-nums text-muted-foreground",
                  content.tone === "warn" && "text-amber-600",
                  content.tone === "limit" && "text-destructive",
                )}
              >
                {content.counter}
              </span>
              <Button type="submit" disabled={!content.trimmed || thread.isPublishing}>
                {REVIEWS_COPY.publishComment}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDeleteId(null);
        }}
        id={pendingDeleteId ?? ""}
        title={REVIEWS_COPY.deleteCommentTitle}
        description={REVIEWS_COPY.deleteCommentBody}
        buttonLabel={REVIEWS_COPY.deleteComment}
        queryKeyToInvalidate="reviews"
        onConfirm={async (id) => {
          await thread.remove(id);
          setPendingDeleteId(null);
        }}
      />
    </>
  );
}

function CommentRow({
  comment,
  canDelete,
  onReply,
  onDelete,
}: {
  comment: {
    id: string;
    authorDisplayName: string;
    authorAvatarSeed: string | null;
    content: string;
    createdAt: string;
  };
  canDelete: boolean;
  onReply: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-3">
      <ProfileAvatar
        initials={readerInitials(comment.authorDisplayName)}
        avatarSeed={comment.authorAvatarSeed}
        size="xs"
        alt=""
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{comment.authorDisplayName}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{comment.content}</p>
        <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
          <button type="button" className="hover:text-foreground" onClick={onReply}>
            Responder
          </button>
          {canDelete ? (
            <button type="button" className="hover:text-destructive" onClick={onDelete}>
              {REVIEWS_COPY.deleteComment}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
