"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { COMMUNITY_PATH } from "@/lib/routes/community";

import FollowRecommendationRow from "../followRecommendationRow";
import type { ZeroFollowingNudgeProps } from "./types/zeroFollowingNudge.types";

function ZeroFollowingNudge({
  recommendations,
  isLoading,
  isError,
  onRetry,
  onToggleFollow,
  pendingUserId,
  isTogglePending,
  nudgeRef,
}: ZeroFollowingNudgeProps) {
  return (
    <section
      ref={nudgeRef}
      className="rounded-2xl border border-zinc-200 bg-linear-to-b from-zinc-50/90 to-white p-5 shadow-sm dark:border-zinc-800 dark:from-zinc-900/50 dark:to-zinc-950/40 sm:p-6"
      aria-labelledby="zero-following-nudge-title"
      data-testid="zero-following-nudge"
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
          <UserPlus className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 space-y-1">
          <h2
            id="zero-following-nudge-title"
            className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            Você ainda não segue ninguém
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Siga leitores com gostos parecidos aos seus para ver o que eles estão
            lendo. A Comunidade tem a lista completa.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : null}

      {isError ? (
        <div className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Não foi possível carregar as recomendações.
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-11 cursor-pointer"
            onClick={onRetry}
          >
            Tentar de novo
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError && recommendations.length > 0 ? (
        <ul className="space-y-3">
          {recommendations.map((recommendation) => (
            <li key={recommendation.readerId}>
              <FollowRecommendationRow
                recommendation={recommendation}
                isToggleBusy={
                  isTogglePending && pendingUserId === recommendation.readerId
                }
                onToggleFollow={() =>
                  onToggleFollow(recommendation.readerId)
                }
              />
            </li>
          ))}
        </ul>
      ) : null}

      {!isLoading && !isError && recommendations.length === 0 ? (
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Em breve haverá outros leitores para seguir. Enquanto isso, explore a
          Comunidade.
        </p>
      ) : null}

      <div className="mt-4">
        <Button asChild variant="outline" className="h-11 w-full cursor-pointer">
          <Link href={COMMUNITY_PATH} aria-label="Abrir a Comunidade">
            Ver comunidade
          </Link>
        </Button>
      </div>
    </section>
  );
}

export default ZeroFollowingNudge;
