import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookCatalogMatchResult } from "../types/bookDiscovery.types";

type FoundCatalogBookDialogProps = {
  open: boolean;
  matchedBook: BookCatalogMatchResult | null;
  onAddExisting: () => void;
  onIgnoreAndCreate: () => void;
  onCancel: () => void;
};

export function FoundCatalogBookDialog({
  open,
  matchedBook,
  onAddExisting,
  onIgnoreAndCreate,
  onCancel,
}: FoundCatalogBookDialogProps) {
  const candidate = matchedBook?.candidate;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Livro encontrado no catálogo</DialogTitle>
          <DialogDescription>
            Já existe um livro parecido no catálogo. Deseja aproveitar esse cadastro?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 text-sm">
          {candidate?.imageUrl ? (
            <img
              src={candidate.imageUrl}
              alt={`Capa de ${candidate.title}`}
              className="h-40 w-28 rounded-md object-cover border"
            />
          ) : null}
          <p>
            <strong>Título:</strong> {candidate?.title ?? "-"}
          </p>
          <p>
            <strong>Autor:</strong> {candidate?.authorName ?? "-"}
          </p>
          <p>
            <strong>Sinopse:</strong> {candidate?.synopsis ?? "Não informada"}
          </p>
          <p>
            <strong>Editora:</strong> {candidate?.publisher ?? "Não informada"}
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Voltar
          </Button>
          <Button type="button" variant="secondary" onClick={onIgnoreAndCreate}>
            Ignorar e criar
          </Button>
          <Button type="button" onClick={onAddExisting}>
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
