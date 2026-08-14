import { memo } from "react";

import type { AvatarGridProps } from "@/modules/profile/avatarSelection/types/avatarGrid.types";
import AvatarItem from "../AvatarItem";

function AvatarGridComponent({
  avatarOptions,
  selectedSeed,
  isDisabled,
  onSelectAvatar,
}: AvatarGridProps) {
  return (
    <div
      className="grid grid-cols-4 sm:grid-cols-8 gap-3"
      role="list"
      aria-label="Opções de avatar"
    >
      {avatarOptions.map((option, index) => (
        <div key={option.seed} role="listitem">
          <AvatarItem
            seed={option.seed}
            imageUrl={option.imageUrl}
            optionIndex={index}
            isSelected={selectedSeed === option.seed}
            isDisabled={isDisabled}
            onSelect={onSelectAvatar}
          />
        </div>
      ))}
    </div>
  );
}

export default memo(AvatarGridComponent);
