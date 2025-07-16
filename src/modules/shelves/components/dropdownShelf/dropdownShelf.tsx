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
  editShelve: () => void;
  removeShelve: () => void;
};

export function DropdownShelf({
  isOpen,
  onOpenChange,
  trigger,
  editShelve,
  removeShelve,
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
          <DropdownMenuItem onClick={editShelve}>
            <p>Editar estante</p>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={removeShelve}>
            <p>Remover estante</p>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
