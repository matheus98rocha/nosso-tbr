import { cn } from "@/lib/utils";
import {
  buildCatalogAvatarUrl,
  isStoredAvatarSeed,
} from "@/modules/profile/avatarSelection/utils";
import { ProfileInitialsAvatar } from "@/modules/profile/components/ProfileInitialsAvatar";
import type { ProfileInitialsAvatarSize } from "@/modules/profile/components/ProfileInitialsAvatar";

import type { ProfileAvatarProps } from "./profileAvatar.types";

const imageSizeByAvatarSize: Record<ProfileInitialsAvatarSize, number> = {
  xs: 36,
  sm: 48,
  md: 64,
  lg: 72,
};

const imageRadiusByAvatarSize: Record<ProfileInitialsAvatarSize, string> = {
  xs: "rounded-full",
  sm: "rounded-xl",
  md: "rounded-2xl",
  lg: "rounded-2xl",
};

export function ProfileAvatar({
  initials,
  avatarSeed,
  size = "md",
  className,
  alt,
}: ProfileAvatarProps) {
  if (isStoredAvatarSeed(avatarSeed)) {
    const imageUrl = buildCatalogAvatarUrl(
      avatarSeed,
      imageSizeByAvatarSize[size],
    );

    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-violet-100 shadow-sm dark:bg-violet-950/50",
          imageRadiusByAvatarSize[size],
          size === "xs" && "size-9",
          size === "sm" && "size-12",
          size === "md" && "size-16",
          size === "lg" && "size-[4.5rem]",
          className,
        )}
      >
        <img
          src={imageUrl}
          alt={alt ?? "Avatar do perfil"}
          width={imageSizeByAvatarSize[size]}
          height={imageSizeByAvatarSize[size]}
          className="size-full object-cover"
          decoding="async"
        />
      </div>
    );
  }

  return (
    <ProfileInitialsAvatar
      initials={initials}
      size={size}
      className={className}
    />
  );
}
