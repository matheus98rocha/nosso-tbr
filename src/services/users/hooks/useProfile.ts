import { UsersService } from "@/services/users/mappers/users.service";
import { UserDomain } from "@/services/users/types/users.types";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useProfile() {
  const { data: profiles = [], isLoading: isLoadingProfiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const userService = new UsersService();
      const data = await userService.get();
      return data;
    },
  });

  const chosenByOptions = useMemo(
    () =>
      (profiles ?? []).map((user: UserDomain) => ({
        label: user.display_name,
        value: user.id,
      })),
    [profiles]
  );

  return {
    chosenByOptions,
    isLoadingProfiles,
  };
}
