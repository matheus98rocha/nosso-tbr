import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Trash2 } from "lucide-react";
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
        className="w-44 z-50"
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={editShelve}
            className="min-h-11 gap-2 cursor-pointer"
          >
            <Pencil className="w-4 h-4 text-muted-foreground" />
            Editar estante
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={removeShelve}
            className="min-h-11 gap-2 cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
            Remover estante
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
