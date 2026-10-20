"use client";

import Link from "next/link";
import { memo } from "react";

import { Button } from "@/components/ui/button";

import type { ProfileHubLinksProps } from "./types/profileHubLinks.types";

function ProfileHubLinksComponent({ links }: ProfileHubLinksProps) {
  return (
    <section
      className="overflow-hidden rounded-2xl border border-violet-200/40 shadow-md dark:border-violet-900/30 dark:bg-zinc-900/50"
      aria-labelledby="profile-hub-heading"
    >
      <div className="space-y-4 p-4 sm:p-6">
        <div className="space-y-1">
          <h2
            id="profile-hub-heading"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
          >
            Atalhos
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Vá direto para estatísticas, estantes e comunidade.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {links.map((link) => (
            <Button
              key={link.href}
              asChild
              variant={link.label === "Comunidade" ? "default" : "outline"}
              className="h-11 cursor-pointer rounded-xl"
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(ProfileHubLinksComponent);
