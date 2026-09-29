import { useDesktopNav } from "../../hooks/useDesktopNav";
import { useHeader } from "../../hooks/useHeader";
import { DesktopNavMenuProps } from "../../types/desktopNavMenu.types";
import { NavItem } from "../navItem";
import { NavSkeleton } from "../navSkeleton";

export function DesktopNavMenu({ isLoading }: DesktopNavMenuProps) {
  const { desktopNavItems, pathname } = useHeader();
  const { handlePrefetch } = useDesktopNav();

  if (isLoading) return <NavSkeleton />;

  return (
    <nav className="desktop-nav shrink-0" aria-label="Navegação principal">
      <ul>
        {desktopNavItems.map((item) => (
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
