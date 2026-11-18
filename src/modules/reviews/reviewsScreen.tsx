"use client";

import { PenLine } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { COMMUNITY_PATH } from "@/lib/routes/community";

import { REVIEWS_COPY } from "./constants";
import ReviewFeedList from "./components/reviewFeedList";
import ReviewsTabs from "./components/reviewsTabs";
import { useReviewReaction, useReviewsScreen } from "./hooks";

export default function ReviewsScreen() {
  const screen = useReviewsScreen();
  const { react } = useReviewReaction(screen.scope);

  const empty = (
    <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <p className="text-sm text-muted-foreground">
        {screen.tab === "minhas"
          ? REVIEWS_COPY.emptyMine
          : screen.tab === "seguindo" && screen.followsNobody
            ? REVIEWS_COPY.emptyFollowingNone
            : screen.tab === "seguindo"
              ? REVIEWS_COPY.emptyFollowing
              : REVIEWS_COPY.emptyAll}
      </p>
      {screen.tab === "seguindo" && screen.followsNobody ? (
        <Button asChild className="mt-4">
          <Link href={COMMUNITY_PATH}>{REVIEWS_COPY.findReaders}</Link>
        </Button>
      ) : (
        <Button type="button" className="mt-4" onClick={screen.openComposer}>
          {screen.tab === "geral" ? REVIEWS_COPY.writeFirst : REVIEWS_COPY.write}
        </Button>
      )}
    </div>
  );

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{REVIEWS_COPY.pageTitle}</h1>
          <p className="text-sm text-muted-foreground">{REVIEWS_COPY.pageDescription}</p>
        </div>
        <Button type="button" className="hidden sm:inline-flex" onClick={screen.openComposer}>
          {REVIEWS_COPY.write}
        </Button>
      </header>
      <ReviewsTabs value={screen.tab} onChange={screen.setTab} />
      <ReviewFeedList
        reviews={screen.feed.reviews}
        isLoading={screen.feed.isLoading}
        isError={screen.feed.isError}
        hasNextPage={screen.feed.hasNextPage}
        isFetchingNextPage={screen.feed.isFetchingNextPage}
        onLoadMore={() => void screen.feed.fetchNextPage()}
        onRetry={() => void screen.feed.refetch()}
        onReact={react}
        empty={empty}
      />
      <Button
        type="button"
        size="icon"
        className="fixed right-4 bottom-24 z-30 size-14 rounded-full shadow-lg sm:hidden"
        aria-label={REVIEWS_COPY.write}
        onClick={screen.openComposer}
      >
        <PenLine className="size-5" />
      </Button>
    </section>
  );
}
