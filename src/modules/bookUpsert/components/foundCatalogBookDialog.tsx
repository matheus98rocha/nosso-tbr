import { memo } from "react";
import Image from "next/image";
import { ArrowLeft, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { FoundCatalogBookDialogProps } from "../types/foundCatalogBookDialog.types";

function optionalText(value: string | null | undefined): string {
  const t = value?.trim();
  return t ? t : "—";
}

export const FoundCatalogBookDialog = memo(function FoundCatalogBookDialog({
  open,
  matchedBook,
  isLinkingToExisting = false,
  onAddExisting,
  onIgnoreAndCreate,
  onCancel,
}: FoundCatalogBookDialogProps) {
  const candidate = matchedBook?.candidate;

  const pagesLabel =
    candidate?.pages != null && !Number.isNaN(candidate.pages)
      ? String(candidate.pages)
      : "—";

  const busy = isLinkingToExisting;

  const fieldClass =
    "border-b border-border/80 pb-3 last:border-b-0 last:pb-0 sm:border-b-0 sm:pb-0";

  const chromeIconBtnClass =
    "absolute top-4 z-10 inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-foreground opacity-80 ring-offset-background transition-colors hover:bg-accent hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "fixed inset-x-0 bottom-0 top-auto left-0 z-100 flex h-auto max-h-[min(92dvh,800px)] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-t-2xl rounded-b-none border-x-0 border-b-0 p-0 shadow-xl duration-200",
          "sm:inset-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[min(88dvh,720px)] sm:w-full sm:max-w-[520px] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:border sm:px-0 sm:pb-0 sm:shadow-xl",
        )}
        aria-busy={busy}
      >
        <button
          type="button"
          className={cn(chromeIconBtnClass, "left-4")}
          aria-label="Voltar ao formulário"
          disabled={busy}
          onClick={onCancel}
        >
          <ArrowLeft />
        </button>

        <DialogClose
          className={cn(chromeIconBtnClass, "right-4")}
          aria-label="Fechar"
        >
          <XIcon />
        </DialogClose>

        <div
          className="flex shrink-0 justify-center pt-4 pb-2 sm:hidden"
          aria-hidden="true"
        >
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <DialogHeader
          className={cn(
            "shrink-0 gap-3 space-y-0 px-5 pb-4 pt-3 text-left sm:px-8 sm:pb-5 sm:pt-6",
            "pl-14 pr-14 sm:pl-16 sm:pr-16",
          )}
        >
          <DialogTitle className="text-foreground text-balance leading-snug">
            Livro encontrado no catálogo
          </DialogTitle>
          <DialogDescription className="text-left text-sm leading-relaxed text-foreground/90 sm:text-base">
            Já existe um livro parecido no catálogo. Você pode entrar na leitura
            que já está cadastrada ou seguir criando um novo cadastro de livro.
          </DialogDescription>
        </DialogHeader>

        <div
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-5 sm:px-8"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-foreground sm:p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
              {candidate?.imageUrl ? (
                <div className="mx-auto shrink-0 sm:mx-0">
                  <Image
                    src={candidate.imageUrl}
                    alt={`Capa de ${candidate.title}`}
                    width={112}
                    height={160}
                    className="h-36 w-24 rounded-md border border-border object-cover shadow-sm sm:h-40 sm:w-28"
                    sizes="(max-width: 640px) 96px, 112px"
                    unoptimized
                    loader={({ src }) => src}
                  />
                </div>
              ) : null}

              <dl className="min-w-0 flex-1 space-y-0 text-sm sm:grid sm:grid-cols-[minmax(0,7.5rem)_1fr] sm:gap-x-3 sm:gap-y-2 sm:space-y-0">
                <div className={cn("sm:contents", fieldClass)}>
                  <dt className="font-medium text-slate-600 dark:text-slate-400 sm:pt-0.5">
                    Título
                  </dt>
                  <dd className="mt-0.5 text-foreground [word-break:break-word] sm:mt-0">
                    {optionalText(candidate?.title)}
                  </dd>
                </div>

                <div className={cn("sm:contents", fieldClass)}>
                  <dt className="font-medium text-slate-600 dark:text-slate-400 sm:pt-0.5">
                    Autor
                  </dt>
                  <dd className="mt-0.5 text-foreground sm:mt-0">
                    {optionalText(candidate?.authorName)}
                  </dd>
                </div>

                <div className={cn("sm:contents", fieldClass)}>
                  <dt className="font-medium text-slate-600 dark:text-slate-400 sm:pt-0.5">
                    Páginas
                  </dt>
                  <dd className="mt-0.5 text-foreground tabular-nums sm:mt-0">
                    {pagesLabel}
                  </dd>
                </div>

                <div className={cn("sm:contents", fieldClass)}>
                  <dt className="font-medium text-slate-600 dark:text-slate-400 sm:pt-0.5">
                    Quem escolheu
                  </dt>
                  <dd className="mt-0.5 text-foreground [word-break:break-word] sm:mt-0">
                    {optionalText(candidate?.chosenByDisplayName)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <DialogFooter
          className={cn(
            "mt-0 flex w-full flex-col gap-3 border-t border-border bg-background px-5 pt-4 sm:mt-0 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-center sm:gap-3 sm:px-8 sm:pt-5",
            "pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-8",
          )}
        >
          <Button
            type="button"
            variant="secondary"
            className="h-11 w-full shrink-0 cursor-pointer px-4 text-base transition-colors duration-200 sm:h-9 sm:w-auto sm:shrink sm:px-3 sm:text-sm"
            disabled={busy}
            onClick={onIgnoreAndCreate}
            title="Descarta a sugestão e envia o cadastro novo que você preencheu."
          >
            Cadastrar um livro novo
          </Button>
          <Button
            type="button"
            className="h-11 w-full shrink-0 cursor-pointer px-4 text-base transition-colors duration-200 sm:h-9 sm:w-auto sm:shrink sm:px-3 sm:text-sm"
            disabled={busy}
            isLoading={busy}
            onClick={onAddExisting}
            title="Adiciona você como leitor neste livro que já existe no catálogo."
          >
            Participar desta leitura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

FoundCatalogBookDialog.displayName = "FoundCatalogBookDialog";
