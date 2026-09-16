const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const COMMUNITY_FALLBACK_DISPLAY_NAME = "Leitor";

export function resolveCommunityDisplayName(
  displayName: string | null | undefined,
): string {
  const trimmed = displayName?.trim() ?? "";

  if (!trimmed || UUID_PATTERN.test(trimmed)) {
    return COMMUNITY_FALLBACK_DISPLAY_NAME;
  }

  return trimmed;
}
