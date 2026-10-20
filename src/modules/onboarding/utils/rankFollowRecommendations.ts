import { getGenderLabel } from "@/constants/genders";
import { pickTopGenre } from "@/modules/community/utils/pickTopGenre";

import type {
  FollowRecommendation,
  RankFollowRecommendationsInput,
} from "../types/onboarding.types";

export const FOLLOW_RECOMMENDATION_LIMIT = 5;

function pickSharedGenreLabel(genders: string[]): string {
  const sorted = [...genders].sort((left, right) =>
    String(getGenderLabel(left)).localeCompare(
      String(getGenderLabel(right)),
      "pt-BR",
    ),
  );
  return sorted[0] ?? genders[0] ?? "";
}

export function rankFollowRecommendations({
  selfId,
  followingIds,
  selfGenders,
  candidates,
  limit = FOLLOW_RECOMMENDATION_LIMIT,
}: RankFollowRecommendationsInput): FollowRecommendation[] {
  const followingSet = new Set(followingIds);
  const selfGenderSet = new Set(
    selfGenders.filter((gender) => gender.trim().length > 0),
  );

  const ranked: FollowRecommendation[] = [];

  for (const candidate of candidates) {
    if (candidate.id === selfId || followingSet.has(candidate.id)) {
      continue;
    }

    const finishedRows = candidate.genreRows
      .filter((row) => row.gender.trim().length > 0 && row.finishedCount > 0)
      .map((row) => ({ gender: row.gender, count: row.finishedCount }));
    const registeredRows = candidate.genreRows
      .filter((row) => row.gender.trim().length > 0 && row.registeredCount > 0)
      .map((row) => ({ gender: row.gender, count: row.registeredCount }));

    const mostRead = pickTopGenre(finishedRows);
    const mostRegistered = pickTopGenre(registeredRows);
    const candidateTopGenders = [mostRead, mostRegistered].filter(
      (gender): gender is string => Boolean(gender),
    );

    const overlap = candidateTopGenders.filter((gender) =>
      selfGenderSet.has(gender),
    );

    let overlapStrength = 0;
    for (const gender of overlap) {
      const row = candidate.genreRows.find((item) => item.gender === gender);
      if (row) {
        overlapStrength += row.finishedCount + row.registeredCount;
      }
    }

    const displayName =
      candidate.displayName.trim().length > 0
        ? candidate.displayName.trim()
        : "Leitor";

    ranked.push({
      readerId: candidate.id,
      displayName,
      avatarSeed: candidate.avatarSeed,
      registeredCount: candidate.registeredCount,
      overlapStrength,
      reason:
        overlap.length > 0
          ? { kind: "shared_genre", gender: pickSharedGenreLabel(overlap) }
          : { kind: "active_reader" },
    });
  }

  ranked.sort((left, right) => {
    const leftShared = left.reason.kind === "shared_genre" ? 1 : 0;
    const rightShared = right.reason.kind === "shared_genre" ? 1 : 0;
    if (leftShared !== rightShared) {
      return rightShared - leftShared;
    }
    if (left.overlapStrength !== right.overlapStrength) {
      return right.overlapStrength - left.overlapStrength;
    }
    if (
      left.reason.kind === "active_reader" &&
      right.reason.kind === "active_reader" &&
      left.registeredCount !== right.registeredCount
    ) {
      return right.registeredCount - left.registeredCount;
    }
    return left.displayName.localeCompare(right.displayName, "pt-BR");
  });

  return ranked.slice(0, Math.max(0, limit));
}

export function formatFollowRecommendationReason(
  reason: FollowRecommendation["reason"],
): string {
  if (reason.kind === "shared_genre") {
    return `Também curte ${getGenderLabel(reason.gender)}`;
  }
  return "Leitor ativo na comunidade";
}
