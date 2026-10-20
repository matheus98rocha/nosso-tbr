"use client";

import Link from "next/link";
import { memo } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProfileAvatar } from "@/modules/profile/components";
import { initialsFromDisplayName } from "@/modules/profile/utils";

import type { PopularReaderCardProps } from "./types";

function PopularReaderCardComponent({
  reader,
  isToggleBusy,
  onFollow,
}: PopularReaderCardProps) {
  return (
    <li className="flex min-w-[9.5rem] flex-1 flex-col items-center gap-2.5 rounded-2xl border border-[color-mix(in_oklch,var(--reading-ink)_10%,transparent)] bg-white/70 px-3 py-3.5 transition-colors hover:border-[color-mix(in_oklch,var(--reading-ink)_22%,transparent)] dark:bg-zinc-950/45">
      <Link
        href={`/profile/${reader.id}`}
        className="flex w-full min-w-0 flex-col items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--reading-ink)] focus-visible:ring-offset-2"
        aria-label={`Ver perfil de ${reader.displayName}`}
      >
        <ProfileAvatar
          initials={initialsFromDisplayName(reader.displayName)}
          avatarSeed={reader.avatarSeed}
          size="md"
          alt={`Avatar de ${reader.displayName}`}
        />
        <div className="w-full min-w-0 space-y-0.5 text-center">
          <p className="truncate text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {reader.displayName}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {reader.followerCount === 1
              ? "1 seguidor"
              : `${reader.followerCount} seguidores`}
          </p>
        </div>
      </Link>
      <Button
        type="button"
        size="sm"
        className={cn(
          "h-11 min-h-11 w-full cursor-pointer rounded-full text-xs",
          !isToggleBusy && "active:scale-[0.98]",
        )}
        disabled={isToggleBusy}
        onClick={onFollow}
        aria-busy={isToggleBusy}
        aria-label={`Seguir ${reader.displayName}`}
      >
        Seguir
      </Button>
    </li>
  );
}

export default memo(PopularReaderCardComponent);
