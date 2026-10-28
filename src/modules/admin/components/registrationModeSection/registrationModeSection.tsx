"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { RegistrationModeSectionProps } from "./types";

const modes = [
  { id: "invite", label: "Convites" },
  { id: "open", label: "Inscrições abertas" },
] as const;

export default function RegistrationModeSection({
  mode,
  isLoading,
  isError,
  pending,
  description,
  openRegistrationUrl,
  copied,
  onModeChange,
  onCopyLink,
}: RegistrationModeSectionProps) {
  return (
    <section
      className="flex flex-col gap-4"
      aria-labelledby="registration-mode-heading"
    >
      <div className="flex flex-col gap-1">
        <h2 id="registration-mode-heading" className="text-lg font-medium">
          Modo de inscrição
        </h2>
        <p className="text-sm text-muted-foreground">
          Escolha se novas contas entram por convite ou com as inscrições
          abertas.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">
          Carregando modo de inscrição…
        </p>
      ) : isError || !mode ? (
        <p className="text-sm text-destructive">
          Não foi possível carregar o modo de inscrição.
        </p>
      ) : (
        <>
          <div
            role="group"
            aria-label="Modo de inscrição"
            aria-busy={pending}
            className="flex rounded-full border bg-muted/40 p-1"
          >
            {modes.map((item) => {
              const isSelected = mode === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={isSelected}
                  disabled={pending}
                  onClick={() => onModeChange(item.id)}
                  className={cn(
                    "min-h-11 flex-1 rounded-full px-3 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
          {mode === "open" ? (
            <div className="flex flex-col gap-3 rounded-md border px-4 py-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium">Link de inscrição</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCopyLink}
                >
                  {copied ? "Copiado" : "Copiar link"}
                </Button>
              </div>
              <code className="break-all rounded-md bg-muted/40 px-3 py-2 text-xs sm:text-sm">
                {openRegistrationUrl}
              </code>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
