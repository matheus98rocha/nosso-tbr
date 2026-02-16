import { BookOpen, BarChart3, Library, Plus, BookUser } from "lucide-react";
import { JSX } from "react";
import { useHeader } from "../../hooks/useHeader";
import { BookUpsert } from "@/modules/bookUpsert/bookUpsert";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<string, JSX.Element> = {
  "Meus Livros": <BookOpen className="w-6 h-6" />,
  "Adicionar Livro": <Plus className="w-6 h-6" />,
  Estatisticas: <BarChart3 className="w-6 h-6" />,
  Estantes: <Library className="w-6 h-6" />,
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
    open: () => void;
    close: () => void;
    toggle: () => void;
    setIsOpen: (open: boolean) => void;
  };
  isLoading: boolean;
};

export function DesktopNavMenu({
  bookUpsertModal,
  isLoading,
}: DesktopNavMenuProps) {
  const { menuItems, pathname } = useHeader();

  const filteredItems = menuItems.flatMap((menu) =>
    menu.items.filter((item) => allowedLabels.includes(item.label)),
  );

  if (isLoading) {
    return (
      <nav className="flex items-center justify-center gap-8 mb-4">
        {Array.from({
          length: filteredItems.length + 1,
        }).map((_, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
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

          const handleClick =
            item.label === "Adicionar Livro"
              ? () => bookUpsertModal.setIsOpen(true)
              : item.action;

          return (
            <button
              key={item.label}
              onClick={handleClick}
              disabled={!!isActive}
              className="flex flex-col items-center gap-1 text-gray-700 hover:text-primary transform hover:scale-110 transition-transform duration-200"
            >
              {iconMap[item.label] ?? <BookOpen className="w-6 h-6" />}
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
