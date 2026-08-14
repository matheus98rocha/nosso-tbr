export { default as AvatarGrid } from "./components/AvatarGrid";
export { default as AvatarItem } from "./components/AvatarItem";
export { default as AvatarSelectionPanel } from "./components/AvatarSelectionPanel";
export { useAvatarSelection } from "./hooks";
export type { AvatarGridProps } from "./types/avatarGrid.types";
export type { AvatarItemProps } from "./types/avatarItem.types";
export type {
  AvatarOption,
  AvatarSelectionViewModel,
} from "./types/avatarSelection.types";
export type {
  AvatarCatalogEntry,
  DiceBearAvatarOptions,
} from "./types/avatarCatalog.types";
export {
  AVATAR_CATALOG,
  AVATAR_OPTIONS,
  buildCatalogAvatarUrl,
  buildDiceBearAvatarUrl,
  getAvatarCatalogEntry,
  isReadingAvatarSeed,
  isStoredAvatarSeed,
  READING_AVATAR_SEEDS,
} from "./utils";
export type { ReadingAvatarSeed } from "./utils";
