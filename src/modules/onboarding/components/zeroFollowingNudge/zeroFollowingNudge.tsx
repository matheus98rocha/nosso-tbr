"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { COMMUNITY_PATH } from "@/lib/routes/community";
import { cn } from "@/lib/utils";

import FollowRecommendationList from "../followRecommendationList";
import type { ZeroFollowingNudgeProps } from "./types/zeroFollowingNudge.types";

function ZeroFollowingNudge({
  isOpen,
  onOpenChange,
  recommendations,
  isLoading,
  isError,
  onRetry,
  onToggleFollow,
  pendingUserId,
  isTogglePending,
}: ZeroFollowingNudgeProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "max-h-[90dvh] gap-0 overflow-hidden border-[color-mix(in_oklch,var(--reading-ink)_14%,transparent)] p-0 sm:max-w-md",
          "bg-[var(--reading-surface)] shadow-[0_28px_80px_-36px_color-mix(in_oklch,var(--reading-ink)_70%,transparent)]",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        )}
        data-testid="zero-following-nudge"
      >
        <DialogHeader
          className="relative gap-2 overflow-hidden px-6 pb-5 pt-7 text-left sm:px-7 sm:pt-8"
          style={{
            background:
              "radial-gradient(ellipse at 8% 0%, color-mix(in oklch, var(--reading-ink) 10%, transparent), transparent 55%), radial-gradient(ellipse at 92% 12%, oklch(0.72 0.06 175 / 0.12), transparent 48%)",
          }}
        >
          <div
            className="auth-noise pointer-events-none absolute inset-0 opacity-[0.045] mix-blend-multiply dark:opacity-[0.08] dark:mix-blend-soft-light"
            aria-hidden
          />
          <p className="relative mb-1 text-[0.65rem] font-semibold tracking-[0.22em] text-[color-mix(in_oklch,var(--reading-ink)_48%,transparent)] uppercase">
            Sua rede de leitura
          </p>
          <DialogTitle className="brand-display relative text-balance pr-8 text-2xl font-semibold leading-tight tracking-tight text-[var(--reading-ink)] sm:text-[1.65rem]">
            Você ainda não segue ninguém
          </DialogTitle>
          <DialogDescription className="relative max-w-[34ch] text-sm leading-relaxed text-[color-mix(in_oklch,var(--reading-ink)_62%,transparent)] sm:text-[0.95rem]">
            Escolha leitores com gostos parecidos aos seus. A lista abaixo é um
            começo — a Comunidade tem o restante.
          </DialogDescription>
        </DialogHeader>

        <div className="border-t border-[color-mix(in_oklch,var(--reading-ink)_10%,transparent)] px-6 py-4 sm:px-7">
          <FollowRecommendationList
            recommendations={recommendations}
            isLoading={isLoading}
            isError={isError}
            onRetry={onRetry}
            onToggleFollow={onToggleFollow}
            pendingUserId={pendingUserId}
            isTogglePending={isTogglePending}
          />
        </div>

        <div className="flex flex-col gap-2 border-t border-[color-mix(in_oklch,var(--reading-ink)_10%,transparent)] bg-[color-mix(in_oklch,var(--reading-ink)_3%,transparent)] px-6 py-4 sm:px-7">
          <Button
            asChild
            className="h-11 w-full cursor-pointer rounded-full bg-[var(--reading-ink)] text-[var(--reading-surface)] hover:opacity-90"
          >
            <Link href={COMMUNITY_PATH} aria-label="Abrir a Comunidade">
              Ver comunidade
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-10 w-full cursor-pointer rounded-full text-[color-mix(in_oklch,var(--reading-ink)_62%,transparent)] hover:bg-transparent hover:text-[var(--reading-ink)]"
            onClick={() => onOpenChange(false)}
          >
            Continuar sem seguir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ZeroFollowingNudge;
