import * as React from "react";
import { BookService } from "@/services/books.services";
import { useQuery } from "@tanstack/react-query";

export function useHome() {
  const [progress, setProgress] = React.useState(0);
  const {
    data: allBooks,
    isFetching: isLoadingAllBooks,
    isFetched,
  } = useQuery({
    queryKey: ["hospitalBed"],
    queryFn: async () => {
      const service = new BookService();
      const data = await service.getAll();
      return data;
    },
  });

  React.useEffect(() => {
    if (!isLoadingAllBooks) {
      setProgress(100);
      const resetTimer = setTimeout(() => setProgress(0), 500);
      return () => clearTimeout(resetTimer);
    }

    setProgress(10);
    const interval = setInterval(() => {
      setProgress((old) => {
        if (old >= 90) {
          clearInterval(interval);
          return old;
        }
        return old + 10;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [isLoadingAllBooks]);

  return {
    allBooks,
    isLoadingAllBooks,
    isFetched,
    progress,
  };
}
