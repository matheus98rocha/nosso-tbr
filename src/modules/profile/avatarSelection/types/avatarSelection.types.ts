import type { ReadingAvatarSeed } from "@/modules/profile/avatarSelection/utils";

export type AvatarOption = {
  seed: ReadingAvatarSeed;
  imageUrl: string;
};

export type AvatarSelectionViewModel = {
  avatarOptions: AvatarOption[];
  selectedSeed: ReadingAvatarSeed | null;
  savedSeed: ReadingAvatarSeed | null;
  isDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;
  onSelectAvatar: (seed: ReadingAvatarSeed) => void;
  onSaveAvatar: () => void;
};
