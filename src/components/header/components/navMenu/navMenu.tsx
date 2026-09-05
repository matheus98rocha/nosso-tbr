import { useMemo } from "react";
import { useHeader } from "../../hooks/useHeader";
import { DesktopNavMenuProps } from "../../types/desktopNavMenu.types";
import { useDesktopNav } from "../../hooks/useDesktopNav";
import { NavSkeleton } from "../navSkeleton";
import { NavItem } from "../navItem";

const ALLOWED_LABELS = [
  "Início",
  "Estatisticas",
  "Ver Estantes",
  "Autores",
  "Administração",
];

export function DesktopNavMenu({ isLoading }: DesktopNavMenuProps) {
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
    <nav className="desktop-nav" aria-label="Navegação principal">
      <ul>
        {filteredItems.map((item) => (
          <NavItem
            key={item.label}
            item={item}
            isActive={!!(item.path && pathname === item.path)}
            onPrefetch={handlePrefetch}
          />
        ))}
      </ul>
    </nav>
  );
}
