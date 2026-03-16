import { useMemo } from "react";
import Link from "next/link";
import { BookOpen, BarChart3, Library, Plus, BookUser } from "lucide-react";
import { IconMap, NavItemProps } from "../../types/desktopNavMenu.types";

const iconMap: IconMap = {
  "Meus Livros": <BookOpen className="w-6 h-6" />,
  "Adicionar Livro": <Plus className="w-6 h-6" />,
  Estatisticas: <BarChart3 className="w-6 h-6" />,
  "Ver Estantes": <Library className="w-6 h-6" />,
  Autores: <BookUser className="w-6 h-6" />,
};

export function NavItem({
  item,
  isActive,
  onPrefetch,
  onOpenModal,
}: NavItemProps) {
  const isAddBook = item.label === "Adicionar Livro";

  const itemClassName = useMemo(
    () => `
    flex flex-col items-center gap-1 text-gray-700 hover:text-primary 
    transform transition-transform duration-200 
    ${isActive ? "opacity-50 cursor-default" : "hover:scale-110"}
  `,
    [isActive],
  );

  const content = (
    <>
      {iconMap[item.label]}
      <span className="text-xs font-medium">{item.label}</span>
    </>
  );

  if (isAddBook) {
    return (
      <button onClick={onOpenModal} className={itemClassName} type="button">
        {content}
      </button>
    );
  }

  return (
    <Link
      href={item.path || "#"}
      onMouseEnter={() => onPrefetch(item.label)}
      onClick={(e) => isActive && e.preventDefault()}
      className={itemClassName}
    >
      {content}
    </Link>
  );
}
