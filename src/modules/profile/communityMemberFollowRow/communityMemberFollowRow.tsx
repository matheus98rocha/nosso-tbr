import { Button } from "@/components/ui/button";
import { memo } from "react";
import type { CommunityMemberFollowRowProps } from "@/modules/profile/communityMemberFollowRow/types/communityMemberFollowRow.types";

function CommunityMemberFollowRowComponent({
  displayName,
  email,
  isFollowing,
  isToggleBusy,
  onPress,
}: CommunityMemberFollowRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
      <div className="min-w-0">
        <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {displayName}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
          {email || "—"}
        </p>
      </div>
      <Button
        type="button"
        variant={isFollowing ? "secondary" : "default"}
        className="h-11 min-w-[120px] shrink-0 rounded-xl cursor-pointer transition-colors"
        disabled={isToggleBusy}
        onClick={onPress}
        aria-busy={isToggleBusy}
        aria-label={
          isFollowing
            ? `Unfollow ${displayName}`
            : `Follow ${displayName}`
        }
        aria-pressed={isFollowing}
      >
        {isFollowing ? "Following" : "Follow"}
      </Button>
    </div>
  );
}

export default memo(CommunityMemberFollowRowComponent);
