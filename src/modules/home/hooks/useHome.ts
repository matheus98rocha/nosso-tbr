import { BookService } from "@/modules/home/services/books.services";
import { useQuery } from "@tanstack/react-query";
import { FiltersOptions } from "../components/filtersSheet/filters";
import { useUserStore } from "@/stores/userStore";

type UseHome = {
  filters: FiltersOptions;
  search?: string;
};

export function useHome({ filters, search }: UseHome) {
  const fetchUser = useUserStore((state) => state.fetchUser);

  const {
    data: allBooks,
    isFetching: isLoadingAllBooks,
    isFetched,
    isError,
  } = useQuery({
    queryKey: ["books", filters, search],
    queryFn: async () => {
      const service = new BookService();
      return service.getAll(filters, search);
    },
  });

  const {
    data: userData,
    isLoading: isLoadingUser,
    isError: isErrorUser,
  } = useQuery({
    queryKey: ["user"],
    queryFn: () =>
      fetchUser().then(() => {
        const user = useUserStore.getState().user;
        const error = useUserStore.getState().error;
        if (error) throw new Error(error);
        return user;
      }),
  });

  return {
    allBooks,
    isLoadingAllBooks,
    isFetched,
    isError,
    user: userData,
    isLoadingUser,
    isErrorUser,
  };
}
