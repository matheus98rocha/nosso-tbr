import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";

import type { CollectiveReadingCommentListProps } from "../types/collectiveReading.types";

export default function CollectiveReadingCommentList({
  comments,
  isLoading,
  currentUserId,
  reactionPendingCommentId,
  onRequestDelete,
  onToggleReaction,
}: CollectiveReadingCommentListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (!comments.length) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Nenhum comentário ainda. Seja o primeiro a comentar esta leitura.
      </p>
    );
  }

  return (
    <ul className="space-y-3" role="list">
      {comments.map((c) => (
        <li key={c.id}>
          <Card className="border-zinc-200 bg-zinc-50/50 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
              <div className="min-w-0 flex-1 space-y-1">
                <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {c.authorDisplayName}
                </CardTitle>
                <CardDescription className="text-xs">
                  {new Date(c.createdAt).toLocaleString("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </CardDescription>
              </div>
              {currentUserId && c.userId === currentUserId ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 text-zinc-500 hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 cursor-pointer"
                  aria-label="Remover comentário"
                  onClick={() => onRequestDelete(c.id)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                {c.content}
              </p>
              {currentUserId ? (
                <div className="flex flex-wrap items-center gap-2 border-t border-zinc-200/80 pt-3 dark:border-zinc-800/80">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={Boolean(reactionPendingCommentId)}
                    className={`h-8 gap-1.5 rounded-lg px-2 text-xs cursor-pointer ${
                      c.userReaction === "like"
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-200 dark:hover:bg-emerald-950/60"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/80"
                    }`}
                    aria-pressed={c.userReaction === "like"}
                    aria-label={`Curtir comentário. ${c.likeCount} curtida(s).`}
                    onClick={() => onToggleReaction(c.id, "like")}
                  >
                    <ThumbsUp className="size-3.5 shrink-0" aria-hidden />
                    <span>{c.likeCount}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={Boolean(reactionPendingCommentId)}
                    className={`h-8 gap-1.5 rounded-lg px-2 text-xs cursor-pointer ${
                      c.userReaction === "dislike"
                        ? "bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-100 dark:hover:bg-amber-950/50"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/80"
                    }`}
                    aria-pressed={c.userReaction === "dislike"}
                    aria-label={`Não curtir comentário. ${c.dislikeCount} não curtida(s).`}
                    onClick={() => onToggleReaction(c.id, "dislike")}
                  >
                    <ThumbsDown className="size-3.5 shrink-0" aria-hidden />
                    <span>{c.dislikeCount}</span>
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
