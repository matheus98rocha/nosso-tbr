import type { DiceBearAvatarOptions } from "@/modules/profile/avatarSelection/types/avatarCatalog.types";

import {
  DICEBEAR_API_VERSION,
  DICEBEAR_AVATAR_STYLE,
  getAvatarCatalogEntry,
} from "./avatarCatalog";

type BuildDiceBearAvatarUrlOptions = {
  seed: string;
  size?: number;
  options?: DiceBearAvatarOptions;
};

export function buildDiceBearAvatarUrl({
  seed,
  size,
  options,
}: BuildDiceBearAvatarUrlOptions): string {
  const params = new URLSearchParams({ seed });

  if (size) {
    params.set("size", String(size));
  }

  if (options) {
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        params.set(key, String(value));
      }
    });
  }

  return `https://api.dicebear.com/${DICEBEAR_API_VERSION}/${DICEBEAR_AVATAR_STYLE}/svg?${params.toString()}`;
}

export function buildCatalogAvatarUrl(seed: string, size?: number): string {
  const entry = getAvatarCatalogEntry(seed);

  return buildDiceBearAvatarUrl({
    seed,
    size,
    options: entry?.options,
  });
}
