import { BookService } from "@/modules/home/services/books.services";
import { useQuery } from "@tanstack/react-query";
import { FiltersOptions } from "../components/filtersSheet/filters";

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
  return {
    allBooks,
    isLoadingAllBooks,
    isFetched,
    isError,
  };
}
