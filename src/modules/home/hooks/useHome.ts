import { BookService } from "@/modules/home/services/books.services";
import { useQuery } from "@tanstack/react-query";
import { FiltersOptions } from "../components/filtersSheet/filters";
import { createClient } from "@/lib/supabase/client";

type UseHome = {
  filters: FiltersOptions;
  search?: string;
};

export function useHome({ filters, search }: UseHome) {
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
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
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
