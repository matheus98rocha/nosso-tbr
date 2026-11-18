import type { ReviewScope, ReviewTab } from "../types";

const TABS: ReviewTab[] = ["geral", "seguindo", "minhas"];

export function parseReviewTab(value: string | null): ReviewTab {
  if (value && TABS.includes(value as ReviewTab)) {
    return value as ReviewTab;
  }
  return "geral";
}

export function scopeFromTab(tab: ReviewTab): ReviewScope {
  if (tab === "seguindo") return "following";
  if (tab === "minhas") return "mine";
  return "all";
}
