import type { ProfileInitialsAvatarSize } from "@/modules/profile/components/ProfileInitialsAvatar";

export type ProfileAvatarProps = {
  initials: string;
  avatarSeed?: string | null;
  size?: ProfileInitialsAvatarSize;
  className?: string;
  alt?: string;
};
