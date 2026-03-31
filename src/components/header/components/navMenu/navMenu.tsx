// DesktopNavMenu.tsx
import { useMemo } from "react";
import { useHeader } from "../../hooks/useHeader";
import { BookUpsert } from "@/modules/bookUpsert";
import { DesktopNavMenuProps } from "../../types/desktopNavMenu.types";
import { useDesktopNav } from "../../hooks/useDesktopNav";
import { NavSkeleton } from "../navSkeleton";
import { NavItem } from "../navItem";

const ALLOWED_LABELS = [
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
      <nav className="flex items-center justify-center gap-1 mb-2">
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
