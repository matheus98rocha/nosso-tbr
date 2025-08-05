import { BookService } from "@/modules/home/services/books.services";
import { useQuery } from "@tanstack/react-query";
import { FiltersOptions } from "../components/filtersSheet/filters";

type UseHome = {
  filters: FiltersOptions;
};

export function useHome({ filters }: UseHome) {
  const {
    data: allBooks,
    isFetching: isLoadingAllBooks,
    isFetched,
    isError,
  } = useQuery({
    queryKey: ["books", filters],
    queryFn: async () => {
      console.log(filters);
      const service = new BookService();
      return service.getAll(filters);
    },
  });
  return {
    allBooks,
    isLoadingAllBooks,
    isFetched,
    isError,
  };
}
