import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReactNode } from "react";
import { BookDialog } from "../bookDialog/bookDialog";
import { DialogTrigger } from "@radix-ui/react-dialog";

type DropdownMenuWrapperProps = {
  trigger: ReactNode;
};

export function DropdownBook({ trigger }: DropdownMenuWrapperProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div>{trigger}</div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 z-50"
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BookDialog
              trigger={
                <DialogTrigger asChild>
                  <p>Editar Livro Livro</p>
                </DialogTrigger>
              }
            />
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
