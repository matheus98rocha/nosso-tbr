import { BookCard } from "@/modules/home/components/bookCard/bookCard";
import { BookDomain } from "@/types/books.types";

export const BookList = ({ books }: { books: BookDomain[] }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {books.map((book) => (
        <BookCard book={book} key={book.id} />
      ))}
    </div>
  );
};
