import { UsersService } from "@/services/users/mappers/users.service";
import { UserDomain } from "@/services/users/types/users.types";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useUser() {
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const userService = new UsersService();
      const data = await userService.get();
      return data;
    },
  });

  const chosenByOptions = useMemo(
    () =>
      (users ?? []).map((user: UserDomain) => ({
        label: user.display_name,
        value: user.id,
      })),
    [users]
  );

  return {
    users,
    chosenByOptions,
    isLoadingUsers,
  };
}
