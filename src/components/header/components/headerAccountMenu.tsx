"use client";

import { LogOut, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileAvatar } from "@/modules/profile/components";
import { cn } from "@/lib/utils";

import type { HeaderAccountMenuProps } from "../types/headerAccount.types";

export default function HeaderAccountMenu({
  account,
  isLoading,
  isLoggedIn,
  onNavigateToProfile,
  onLogout,
  onNavigateToAuth,
  showDisplayName = true,
  className,
}: HeaderAccountMenuProps) {
  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Skeleton className="size-9 shrink-0 rounded-full" />
        {showDisplayName ? (
          <Skeleton className="hidden h-4 w-24 rounded-md lg:block" />
        ) : null}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-11 gap-2 rounded-full px-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800",
            className,
          )}
          aria-label={
            account
              ? `Menu da conta de ${account.displayName}`
              : "Menu da conta"
          }
        >
          {account ? (
            <ProfileAvatar
              initials={account.avatarInitials}
              avatarSeed={account.avatarSeed}
              size="xs"
              className="shadow-sm ring-2 ring-white dark:ring-zinc-900"
              alt={`Avatar de ${account.displayName}`}
            />
          ) : (
            <span className="flex size-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <UserRound className="size-4 text-zinc-500" aria-hidden />
            </span>
          )}
          {showDisplayName && account ? (
            <span className="hidden max-w-[140px] truncate text-sm font-medium text-zinc-800 dark:text-zinc-100 lg:inline">
              {account.displayName}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {isLoggedIn && account ? (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex min-w-0 flex-col gap-0.5 py-0.5">
                <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {account.displayName}
                </span>
                <span className="truncate text-xs font-normal text-zinc-500 dark:text-zinc-400">
                  {account.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onClick={onNavigateToProfile}
            >
              <UserRound className="size-4" aria-hidden />
              Meu perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-rose-600 focus:text-rose-600 dark:text-rose-400 dark:focus:text-rose-400"
              onClick={onLogout}
            >
              <LogOut className="size-4" aria-hidden />
              Sair
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem className="cursor-pointer" onClick={onNavigateToAuth}>
            Entrar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
