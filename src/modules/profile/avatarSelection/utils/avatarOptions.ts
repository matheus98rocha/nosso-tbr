import { AVATAR_CATALOG } from "./avatarCatalog";
import { buildCatalogAvatarUrl } from "./buildDiceBearAvatarUrl";

export const AVATAR_OPTIONS = AVATAR_CATALOG.map((entry) =>
  buildCatalogAvatarUrl(entry.seed),
);
