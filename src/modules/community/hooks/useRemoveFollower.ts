import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/constants/keys";
import { UserSocialService } from "@/services/userSocial/userSocial.service";

import type { CommunitySnapshot } from "../types/community.types";

const userSocialService = new UserSocialService();

const REMOVE_FOLLOWER_ERROR =
  "Não foi possível remover esse seguidor. Tente de novo.";

type RemoveFollowerContext = {
  previousSnapshot: CommunitySnapshot | undefined;
  previousFollowers: string[] | undefined;
};

type RemoveFollowerOptions = {
  onSuccess?: () => void;
};

export function useRemoveFollower(selfId: string) {
  const queryClient = useQueryClient();
  const snapshotKey = QUERY_KEYS.community.snapshot(selfId);
  const followersKey = ["userSocial", "followers", selfId] as const;

  const mutation = useMutation({
    mutationFn: (followerId: string) =>
      userSocialService.removeFollower(followerId),
    onMutate: async (followerId): Promise<RemoveFollowerContext> => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: snapshotKey }),
        queryClient.cancelQueries({ queryKey: followersKey }),
      ]);

      const previousSnapshot =
        queryClient.getQueryData<CommunitySnapshot>(snapshotKey);
      const previousFollowers =
        queryClient.getQueryData<string[]>(followersKey);

      if (previousSnapshot) {
        queryClient.setQueryData<CommunitySnapshot>(snapshotKey, {
          ...previousSnapshot,
          followerIds: previousSnapshot.followerIds.filter(
            (id) => id !== followerId,
          ),
          members: previousSnapshot.members.map((member) =>
            member.id === followerId
              ? { ...member, isFollower: false }
              : member,
          ),
        });
      }

      if (previousFollowers) {
        queryClient.setQueryData<string[]>(
          followersKey,
          previousFollowers.filter((id) => id !== followerId),
        );
      }

      return { previousSnapshot, previousFollowers };
    },
    onError: (_error, _followerId, context) => {
      if (context?.previousSnapshot) {
        queryClient.setQueryData(snapshotKey, context.previousSnapshot);
      }

      if (context?.previousFollowers) {
        queryClient.setQueryData(followersKey, context.previousFollowers);
      }

      toast.error(REMOVE_FOLLOWER_ERROR);
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.community.all }),
        queryClient.invalidateQueries({
          queryKey: ["userSocial", "followers"],
        }),
      ]);
    },
  });

  const { mutate, isPending, variables } = mutation;

  const removeFollower = useCallback(
    (followerId: string, options?: RemoveFollowerOptions) => {
      if (!selfId || followerId === selfId) {
        return;
      }

      mutate(followerId, { onSuccess: options?.onSuccess });
    },
    [mutate, selfId],
  );

  return {
    removeFollower,
    isRemovePending: isPending,
    pendingRemovalUserId: isPending ? (variables ?? null) : null,
  };
}
