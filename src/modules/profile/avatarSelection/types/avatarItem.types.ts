import type { ReadingAvatarSeed } from "@/modules/profile/avatarSelection/utils";

export type AvatarItemProps = {
  seed: ReadingAvatarSeed;
  imageUrl: string;
  optionIndex: number;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: (seed: ReadingAvatarSeed) => void;
};
