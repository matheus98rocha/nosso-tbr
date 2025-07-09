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
};

export function DropdownBook({
  isOpen,
  onOpenChange,
  trigger,
  editBook,
  removeBook,
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
