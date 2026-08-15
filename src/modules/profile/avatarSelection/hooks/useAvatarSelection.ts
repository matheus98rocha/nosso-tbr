import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { AvatarSelectionViewModel } from "@/modules/profile/avatarSelection/types/avatarSelection.types";
import {
  AVATAR_CATALOG,
  buildCatalogAvatarUrl,
  isReadingAvatarSeed,
  type ReadingAvatarSeed,
} from "@/modules/profile/avatarSelection/utils";
import { useClientMounted } from "@/modules/profile/hooks/useClientMounted";
import { UserSocialService } from "@/services/userSocial/userSocial.service";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useUserStore } from "@/stores/userStore";

const userSocialService = new UserSocialService();

export function useAvatarSelection(): AvatarSelectionViewModel {
  const queryClient = useQueryClient();
  const user = useUserStore((state) => state.user);
  const isClientReady = useClientMounted();
  const isLoggedIn = useIsLoggedIn();

  const profileQuery = useQuery({
    queryKey: ["userSocial", "user", user?.id],
    queryFn: () => userSocialService.getUserById(user!.id),
    enabled: isClientReady && isLoggedIn && !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  const savedSeed = useMemo((): ReadingAvatarSeed | null => {
    const seed = profileQuery.data?.avatarSeed;
    return isReadingAvatarSeed(seed) ? seed : null;
  }, [profileQuery.data?.avatarSeed]);

  const [selectedSeed, setSelectedSeed] = useState<ReadingAvatarSeed | null>(
    null,
  );

  useEffect(() => {
    setSelectedSeed(savedSeed);
  }, [savedSeed]);

  const avatarOptions = useMemo(() => {
    return AVATAR_CATALOG.map((entry) => ({
      seed: entry.seed,
      imageUrl: buildCatalogAvatarUrl(entry.seed, 96),
    }));
  }, []);

  const saveAvatarMutation = useMutation({
    mutationFn: (seed: ReadingAvatarSeed) => {
      if (!isReadingAvatarSeed(seed)) {
        throw new Error("Invalid avatar seed");
      }

      return userSocialService.updateAvatarSeed(seed);
    },
    onSuccess: (_data, seed) => {
      queryClient.invalidateQueries({
        queryKey: ["userSocial", "user", user?.id],
      });
      setSelectedSeed(seed);
      toast("Avatar atualizado com sucesso!");
    },
    onError: () => {
      toast("Não foi possível salvar o avatar", {
        description: "Tente novamente em instantes.",
      });
    },
  });

  const onSelectAvatar = useCallback((seed: ReadingAvatarSeed) => {
    setSelectedSeed(seed);
  }, []);

  const onSaveAvatar = useCallback(() => {
    if (!selectedSeed || !isReadingAvatarSeed(selectedSeed)) {
      return;
    }

    saveAvatarMutation.mutate(selectedSeed);
  }, [saveAvatarMutation, selectedSeed]);

  const isDirty = selectedSeed !== savedSeed && selectedSeed !== null;

  return useMemo(
    (): AvatarSelectionViewModel => ({
      avatarOptions,
      selectedSeed,
      savedSeed,
      isDirty,
      isSaving: saveAvatarMutation.isPending,
      isLoading: profileQuery.isLoading,
      onSelectAvatar,
      onSaveAvatar,
    }),
    [
      avatarOptions,
      isDirty,
      onSaveAvatar,
      onSelectAvatar,
      profileQuery.isLoading,
      saveAvatarMutation.isPending,
      savedSeed,
      selectedSeed,
    ],
  );
}
