"use client";

import { ProfileAvatar } from "@/modules/profile/components";
import { cn } from "@/lib/utils";

import type { HeaderAccountSummaryProps } from "../types/headerAccount.types";

export default function HeaderAccountSummary({
  account,
  className,
}: HeaderAccountSummaryProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <ProfileAvatar
        initials={account.avatarInitials}
        avatarSeed={account.avatarSeed}
        size="sm"
        className="shadow-sm ring-2 ring-white dark:ring-zinc-900"
        alt={`Avatar de ${account.displayName}`}
      />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {account.displayName}
        </p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {account.email}
        </p>
      </div>
    </div>
  );
}
