import { UserSocialService } from "@/services/userSocial/userSocial.service";
import {
  FollowToggleMutationContext,
  FollowToggleVariables,
} from "@/modules/profile/types/followToggle.types";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

const service = new UserSocialService();

export function useOptimisticFollowToggle(currentUserId: string | undefined) {
  const queryClient = useQueryClient();

  const followingQueryKey = useMemo(
    () => ["userSocial", "following", currentUserId] as const,
    [currentUserId],
  );

  const mutation = useMutation({
    mutationFn: async ({ userId, nextFollowing }: FollowToggleVariables) => {
      if (nextFollowing) {
        await service.follow(userId);
      } else {
        await service.unfollow(userId);
      }
    },
    onMutate: async ({
      userId,
      nextFollowing,
    }: FollowToggleVariables): Promise<FollowToggleMutationContext> => {
      await queryClient.cancelQueries({ queryKey: followingQueryKey });
      const previous = queryClient.getQueryData<string[]>(followingQueryKey);
      const base = previous ?? [];
      const next = nextFollowing
        ? [...new Set([...base, userId])]
        : base.filter((id) => id !== userId);
      queryClient.setQueryData(followingQueryKey, next);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(followingQueryKey, context.previous);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["userSocial", "following"],
      });
    },
  });

  const { mutate, isPending, variables } = mutation;

  const toggleFollow = useCallback(
    (userId: string, nextFollowing: boolean) => {
      if (!currentUserId || userId === currentUserId) {
        return;
      }
      mutate({ userId, nextFollowing });
    },
    [currentUserId, mutate],
  );

  const pendingUserId = variables?.userId ?? null;

  return {
    toggleFollow,
    isTogglePending: isPending,
    pendingUserId,
  };
}
