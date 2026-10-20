"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import { memo } from "react";

import type { ProfileNetworkCountLinksProps } from "./types/profileNetworkCountLinks.types";

function ProfileNetworkCountLinksComponent({
  followingCount,
  followerCount,
  followingHref,
  followersHref,
}: ProfileNetworkCountLinksProps) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
      <Link
        href={followingHref}
        className="inline-flex items-center gap-1.5 transition-colors hover:text-violet-700 dark:hover:text-violet-300"
      >
        <Users className="size-4 shrink-0" aria-hidden />
        Seguindo{" "}
        <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-200">
          {followingCount}
        </span>
      </Link>
      <Link
        href={followersHref}
        className="inline-flex items-center gap-1.5 transition-colors hover:text-violet-700 dark:hover:text-violet-300"
      >
        <Users className="size-4 shrink-0" aria-hidden />
        Seguidores{" "}
        <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-200">
          {followerCount}
        </span>
      </Link>
    </span>
  );
}

export default memo(ProfileNetworkCountLinksComponent);
