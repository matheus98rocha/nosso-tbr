import { getGenderLabel } from "@/constants/genders";

import type { GenreCount } from "../types/community.types";

export function pickTopGenre(rows: GenreCount[]): string | null {
  const eligible = rows.filter(
    (row) => row.gender.trim().length > 0 && row.count > 0,
  );

  if (eligible.length === 0) {
    return null;
  }

  const maxCount = Math.max(...eligible.map((row) => row.count));
  const tied = eligible.filter((row) => row.count === maxCount);

  tied.sort((left, right) =>
    String(getGenderLabel(left.gender)).localeCompare(
      String(getGenderLabel(right.gender)),
      "pt-BR",
    ),
  );

  return tied[0]?.gender ?? null;
}
