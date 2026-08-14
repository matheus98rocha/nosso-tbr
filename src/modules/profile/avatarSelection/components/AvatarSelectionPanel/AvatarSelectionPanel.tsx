"use client";

import { Loader2 } from "lucide-react";
import { memo } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AvatarGrid from "@/modules/profile/avatarSelection/components/AvatarGrid";
import { useAvatarSelection } from "@/modules/profile/avatarSelection/hooks";

function AvatarSelectionPanelComponent() {
  const {
    avatarOptions,
    selectedSeed,
    isDirty,
    isSaving,
    isLoading,
    onSelectAvatar,
    onSaveAvatar,
  } = useAvatarSelection();

  const isInteractionDisabled = isLoading || isSaving;

  return (
    <Card className="dark:bg-zinc-900/50 rounded-2xl shadow-md border border-violet-200/40 dark:border-violet-900/30 overflow-hidden">
      <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
        <CardTitle className="text-lg text-zinc-900 dark:text-zinc-100">
          Escolha seu avatar 📖
        </CardTitle>
        <CardDescription className="text-sm text-zinc-500 dark:text-zinc-400">
          Selecione um personagem do universo da leitura. Seu avatar aparece no
          perfil e no menu da conta.
        </CardDescription>
      </CardHeader>
      <CardContent className="py-6 space-y-5">
        {isLoading ? (
          <div
            className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500 dark:text-zinc-400"
            aria-live="polite"
          >
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Carregando avatares...
          </div>
        ) : (
          <>
            <AvatarGrid
              avatarOptions={avatarOptions}
              selectedSeed={selectedSeed}
              isDisabled={isInteractionDisabled}
              onSelectAvatar={onSelectAvatar}
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {selectedSeed
                  ? "Toque em salvar para aplicar o avatar escolhido."
                  : "Escolha uma opção acima para personalizar seu perfil."}
              </p>
              <Button
                type="button"
                className="h-11 min-w-[140px] rounded-xl cursor-pointer"
                disabled={!isDirty || isSaving}
                aria-busy={isSaving}
                onClick={onSaveAvatar}
              >
                {isSaving ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Salvando...
                  </span>
                ) : (
                  "Salvar avatar"
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(AvatarSelectionPanelComponent);
