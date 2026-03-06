import { BookOpen, BarChart3, Library, Plus, BookUser } from "lucide-react";
import { JSX, useCallback, useMemo } from "react";
import { useHeader } from "../../hooks/useHeader";
import { BookUpsert } from "@/modules/bookUpsert/bookUpsert";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { BookService } from "@/services/books/books.service";
import { useUserStore } from "@/stores/userStore";
import { AuthorsService } from "@/modules/authors/services/authors.service";
import { StatsService } from "@/modules/stats/services/stats.service";
import { INITIAL_FILTERS, QUERY_KEYS } from "@/constants/keys";
import { fetchBookShelves } from "@/modules/shelves/services/booksshelves.service";

const iconMap: Record<string, JSX.Element> = {
  "Meus Livros": <BookOpen className="w-6 h-6" />,
  "Adicionar Livro": <Plus className="w-6 h-6" />,
  Estatisticas: <BarChart3 className="w-6 h-6" />,
  "Ver Estantes": <Library className="w-6 h-6" />,
  Autores: <BookUser className="w-6 h-6" />,
};

const allowedLabels = [
  "Meus Livros",
  "Adicionar Livro",
  "Estatisticas",
  "Ver Estantes",
  "Autores",
];

type DesktopNavMenuProps = {
  bookUpsertModal: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
  };
  isLoading: boolean;
};

export function DesktopNavMenu({
  bookUpsertModal,
  isLoading,
}: DesktopNavMenuProps) {
  const queryClient = useQueryClient();
  const { menuItems, pathname } = useHeader();
  const { user } = useUserStore();

  const bookService = useMemo(() => new BookService(), []);
  const authorsService = useMemo(() => new AuthorsService(), []);
  const statsService = useMemo(() => new StatsService(), []);

  const filteredItems = useMemo(
    () =>
      menuItems.flatMap((menu) =>
        menu.items.filter((item) => allowedLabels.includes(item.label)),
      ),
    [menuItems],
  );

  const handlePrefetch = useCallback(
    async (label: string) => {
      const commonOptions = { staleTime: 1000 * 60 * 5 };

      switch (label) {
        case "Meus Livros":
          if (user?.id) {
            await queryClient.prefetchQuery({
              queryKey: QUERY_KEYS.books.myBooks(
                INITIAL_FILTERS,
                "",
                user.id,
                0,
              ),
              queryFn: () =>
                bookService.getAll({
                  userId: user.id,
                  page: 0,
                  pageSize: 8,
                  filters: INITIAL_FILTERS,
                }),
              ...commonOptions,
            });
          }
          break;
        case "Ver Estantes":
          await queryClient.prefetchQuery({
            queryKey: QUERY_KEYS.shelves.all,
            queryFn: fetchBookShelves,
            ...commonOptions,
          });
          break;
        case "Autores":
          await queryClient.prefetchQuery({
            queryKey: QUERY_KEYS.authors.list(0, ""),
            queryFn: () =>
              authorsService.getAuthors({
                withCountBooks: true,
                page: 0,
                pageSize: 8,
                searchName: "",
              }),
            ...commonOptions,
          });
          break;
        case "Estatisticas":
          const reader = user?.id || "Matheus";
          await Promise.all([
            queryClient.prefetchQuery({
              queryKey: QUERY_KEYS.stats.byReader(reader),
              queryFn: () => statsService.getByReader(reader),
              ...commonOptions,
            }),
            queryClient.prefetchQuery({
              queryKey: QUERY_KEYS.stats.collaboration(reader),
              queryFn: () => statsService.getCollaborationStats(reader),
              ...commonOptions,
            }),
          ]);
          break;
      }
    },
    [queryClient, user, bookService, authorsService, statsService],
  );

  if (isLoading) {
    return (
      <nav className="flex items-center justify-center gap-8 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Skeleton className="w-6 h-6 rounded-full bg-gray-300" />
            <Skeleton className="h-3 w-16 bg-gray-300" />
          </div>
        ))}
      </nav>
    );
  }

  return (
    <>
      <nav className="flex items-center justify-center gap-8 mb-4">
        {filteredItems.map((item) => {
          const isActive = item.path && pathname === item.path;
          const isAddBook = item.label === "Adicionar Livro";

          return (
            <button
              key={item.label}
              onClick={
                isAddBook ? () => bookUpsertModal.setIsOpen(true) : item.action
              }
              onMouseEnter={() => !isAddBook && handlePrefetch(item.label)}
              disabled={!!isActive}
              className="flex flex-col items-center gap-1 text-gray-700 hover:text-primary transform hover:scale-110 transition-transform duration-200 disabled:opacity-50"
            >
              {iconMap[item.label]}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <BookUpsert
        isBookFormOpen={bookUpsertModal.isOpen}
        setIsBookFormOpen={bookUpsertModal.setIsOpen}
      />
    </>
  );
}
