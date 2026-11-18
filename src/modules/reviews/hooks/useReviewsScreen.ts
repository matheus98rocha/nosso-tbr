"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import { REVIEWS_PATH } from "@/lib/routes/reviews";
import { UserSocialService } from "@/services/userSocial/userSocial.service";
import { useUserStore } from "@/stores/userStore";

import { openReviewBlank } from "../stores";
import type { ReviewTab } from "../types";
import { parseReviewTab, scopeFromTab } from "../utils";
import { useReviewFeed } from "./useReviewFeed";

const social = new UserSocialService();

export function useReviewsScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const userId = useUserStore((state) => state.user?.id);
  const tab = parseReviewTab(searchParams.get("aba"));
  const scope = scopeFromTab(tab);
  const feed = useReviewFeed(scope);

  const following = useQuery({
    queryKey: ["userSocial", "following", userId],
    queryFn: () => social.getFollowingIds(),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 2,
  });

  const setTab = useCallback(
    (next: ReviewTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "geral") params.delete("aba");
      else params.set("aba", next);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname || REVIEWS_PATH);
    },
    [pathname, router, searchParams],
  );

  return useMemo(
    () => ({
      tab,
      scope,
      setTab,
      feed,
      followsNobody: following.isSuccess && following.data.length === 0,
      openComposer: openReviewBlank,
    }),
    [feed, following.data, following.isSuccess, scope, setTab, tab],
  );
}
