import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReactNode } from "react";

type DropdownMenuWrapperProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  editBook: () => void;
  removeBook: () => void;
  addToShelf: () => void;
};

export function DropdownBook({
  isOpen,
  onOpenChange,
  trigger,
  editBook,
  removeBook,
  addToShelf,
}: DropdownMenuWrapperProps) {
  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 z-50"
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={addToShelf}>
            <p>Adicionar Livro a Estante</p>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={editBook}>
            <p>Editar Livro</p>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={removeBook}>
            <p>Remover livro</p>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
