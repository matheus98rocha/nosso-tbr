"use client";

import FocusSessionDialog from "./components/FocusSessionDialog";
import FocusTimer from "./components/FocusTimer";
import { useFocusScreen } from "./hooks/useFocusScreen";

export default function FocusScreen() {
  const {
    summary,
    suggestedPage,
    isSaving,
    onConfirmSummary,
    onCancelSummary,
    ...timerProps
  } = useFocusScreen();

  return (
    <main className="mx-auto w-full max-w-3xl">
      <header className="mb-8 border-b border-border pb-8 text-center md:mb-10 md:text-left">
        <h1 className="page-title">Foco de leitura</h1>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground md:mx-0">
          Escolha um livro ou leia livremente, defina quantas páginas quer ler e
          deixe o aviso sonoro marcar o fim da sessão.
        </p>
      </header>

      <FocusTimer {...timerProps} />

      <FocusSessionDialog
        summary={summary}
        suggestedPage={suggestedPage}
        isSaving={isSaving}
        onConfirm={onConfirmSummary}
        onCancel={onCancelSummary}
      />

      <p className="mt-4 text-center text-sm text-muted-foreground">
        O aviso sonoro é emitido pelo navegador e pode ser silenciado a qualquer
        momento.
      </p>
    </main>
  );
}
