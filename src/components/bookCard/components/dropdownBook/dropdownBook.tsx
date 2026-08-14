import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuWrapperProps } from "./types/dropdownBook.types";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function DropdownBook({
  isOpen,
  onOpenChange,
  trigger,
  editBook,
  removeBook,
  removeBookLabel,
  addToShelf,
  shareOnWhatsApp,
  schedule,
  quotes,
  quotesDisabled,
  isFinishedReading,
  onToggleFavorite,
  isFavorite = false,
  favoriteActionBusy = false,
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
          {isFinishedReading && onToggleFavorite && (
            <DropdownMenuItem
              onClick={() => {
                onOpenChange(false);
                onToggleFavorite();
              }}
              disabled={favoriteActionBusy}
              className="cursor-pointer"
            >
              <Heart
                className={cn(
                  "mr-2 size-4 shrink-0",
                  isFavorite && "fill-rose-500 text-rose-500",
                )}
                aria-hidden
              />
              <p>
                {isFavorite ? "Remover dos favoritos" : "Marcar como favorito"}
              </p>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={addToShelf}>
            <p>Adicionar Livro a Estante</p>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={editBook}>
            <p>Editar Livro</p>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={removeBook}>
            <p>{removeBookLabel}</p>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={shareOnWhatsApp}>
            <p>Compartilhar livro no Whatsapp</p>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={schedule} disabled={isFinishedReading}>
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
