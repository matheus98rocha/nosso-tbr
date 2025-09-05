import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuWrapperProps } from "./types/dropdownBook.types";

export function DropdownBook({
  isOpen,
  onOpenChange,
  trigger,
  editBook,
  removeBook,
  addToShelf,
  shareOnWhatsApp,
  schedule,
  quotes,
  isStartedReading,
  quotesDisabled,
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

          <DropdownMenuItem onClick={shareOnWhatsApp}>
            <p>Compartilhar livro no Whatsapp</p>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={schedule} disabled={!isStartedReading}>
            <p>Cronograma</p>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={quotes} disabled={!quotesDisabled}>
            <p>Citações</p>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
