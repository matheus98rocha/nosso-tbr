import { Skeleton } from "@/components/ui/skeleton";
import { BookCard } from "@/modules/home/components/bookCard/bookCard";
import { BookDomain } from "@/modules/home/types/books.types";

export const BookList = ({
  books,
  isLoading,
  isFetched,
}: {
  books: BookDomain[];
  isLoading: boolean;
  isFetched: boolean;
}) => {
  if (isFetched && books.length === 0) {
    return (
      <div className="text-gray-500 text-center mt-4">
        Nenhum livro encontrado.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {isLoading
        ? Array.from({ length: 8 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-[192px] w-[327px] rounded-xl bg-primary opacity-40"
            />
          ))
        : books.map((book) => <BookCard book={book} key={book.id} />)}
    </div>
  );
};
