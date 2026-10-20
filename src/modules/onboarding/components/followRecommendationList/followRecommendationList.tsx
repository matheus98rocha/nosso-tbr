import { BookMarked } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import FollowRecommendationRow from "../followRecommendationRow";
import type { FollowRecommendationListProps } from "./types/followRecommendationList.types";

function FollowRecommendationList({
  recommendations,
  isLoading,
  isError,
  onRetry,
  onToggleFollow,
  pendingUserId,
  isTogglePending,
}: FollowRecommendationListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3 py-2">
        <p className="text-sm text-[color-mix(in_oklch,var(--reading-ink)_72%,transparent)]">
          Não foi possível carregar as recomendações.
        </p>
        <Button
          type="button"
          variant="outline"
          className="h-11 cursor-pointer rounded-full border-[color-mix(in_oklch,var(--reading-ink)_22%,transparent)]"
          onClick={onRetry}
        >
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="flex items-start gap-3 py-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--reading-ink)_8%,transparent)] text-[var(--reading-ink)]">
          <BookMarked className="size-4" aria-hidden />
        </span>
        <p className="text-sm leading-relaxed text-[color-mix(in_oklch,var(--reading-ink)_68%,transparent)]">
          Em breve haverá outros leitores para seguir. Enquanto isso, explore a
          Comunidade.
        </p>
      </div>
    );
  }

  return (
    <ul className="max-h-[min(42vh,22rem)] overflow-y-auto pr-1">
      {recommendations.map((recommendation, index) => (
        <li key={recommendation.readerId}>
          <FollowRecommendationRow
            recommendation={recommendation}
            index={index}
            isToggleBusy={
              isTogglePending && pendingUserId === recommendation.readerId
            }
            onToggleFollow={() => onToggleFollow(recommendation.readerId)}
          />
        </li>
      ))}
    </ul>
  );
}

export default FollowRecommendationList;
