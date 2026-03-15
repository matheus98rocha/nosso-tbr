// DesktopNavMenu.tsx
import { useMemo } from "react";
import { useHeader } from "../../hooks/useHeader";
import { BookUpsert } from "@/modules/bookUpsert/bookUpsert";
import { DesktopNavMenuProps } from "../../types/desktopNavMenu.types";
import { useDesktopNav } from "../../hooks/useDesktopNav";
import { NavSkeleton } from "../navSkeleton/navSkeleton";
import { NavItem } from "../navItem/navItem";

const ALLOWED_LABELS = [
  "Meus Livros",
  "Adicionar Livro",
  "Estatisticas",
  "Ver Estantes",
  "Autores",
];

export function DesktopNavMenu({
  bookUpsertModal,
  isLoading,
}: DesktopNavMenuProps) {
  const { menuItems, pathname } = useHeader();
  const { handlePrefetch } = useDesktopNav();

  const filteredItems = useMemo(
    () =>
      menuItems.flatMap((menu) =>
        menu.items.filter((item) => ALLOWED_LABELS.includes(item.label)),
      ),
    [menuItems],
  );

  if (isLoading) return <NavSkeleton />;

  return (
    <>
      <nav className="flex items-center justify-center gap-8 mb-4">
        {filteredItems.map((item) => (
          <NavItem
            key={item.label}
            item={item}
            isActive={!!(item.path && pathname === item.path)}
            onPrefetch={handlePrefetch}
            onOpenModal={() => bookUpsertModal.setIsOpen(true)}
          />
        ))}
      </nav>
      <BookUpsert
        isBookFormOpen={bookUpsertModal.isOpen}
        setIsBookFormOpen={bookUpsertModal.setIsOpen}
      />
    </>
  );
}
