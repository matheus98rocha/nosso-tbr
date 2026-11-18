"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

import { REVIEWS_COPY } from "../constants";
import type { ReviewTab } from "../types";

const TABS: { value: ReviewTab; label: string }[] = [
  { value: "geral", label: REVIEWS_COPY.tabAll },
  { value: "seguindo", label: REVIEWS_COPY.tabFollowing },
  { value: "minhas", label: REVIEWS_COPY.tabMine },
];

type ReviewsTabsProps = {
  value: ReviewTab;
  onChange: (tab: ReviewTab) => void;
};

export default function ReviewsTabs({ value, onChange }: ReviewsTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={REVIEWS_COPY.tabsLabel}
      className="flex gap-1 rounded-full bg-muted/70 p-1"
    >
      {TABS.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={cn(
              "relative min-h-10 flex-1 rounded-full px-3 text-sm font-medium transition-colors",
              selected ? "text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {selected ? (
              <motion.span
                layoutId="reviews-tab-indicator"
                className="absolute inset-0 rounded-full bg-foreground"
                transition={{ type: "spring", bounce: 0.18, duration: 0.35 }}
              />
            ) : null}
            <span className="relative">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
