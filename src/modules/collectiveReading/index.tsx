"use client";

import Link from "next/link";
import { CalendarDays, MessageCircle, Users } from "lucide-react";

import { ConfirmDialog } from "@/components/confirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";

import CollectiveReadingCommentList from "./components/CollectiveReadingCommentList";
import { useCollectiveReadingScreen } from "./hooks/useCollectiveReadingScreen";
import type { ClientCollectiveReadingProps } from "./types/collectiveReading.types";

export default function ClientCollectiveReading({
  id,
  title,
}: ClientCollectiveReadingProps) {
  const isLogged = useIsLoggedIn();

  const {
    gate,
    gateLoading,
    gateError,
    userId,
    comments,
    commentsLoading,
    commentsError,
    scheduleLoading,
    scheduleChapter,
    draft,
    handleDraftChange,
    handleSubmitComment,
    isSubmittingComment,
    deleteCommentId,
    deleteCommentOpen,
    handleDeleteCommentOpenChange,
    handleOpenDeleteComment,
    confirmDeleteComment,
    deleteCommentPending,
    handleToggleReaction,
    reactionPendingCommentId,
  } = useCollectiveReadingScreen(id);

  if (!isLogged) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-7">
        <header className="space-y-2">
          <h1 className="page-title text-zinc-900 dark:text-zinc-100">
            Leitura coletiva
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400">
            Entre na sua conta para ver o espaço de conversa e comentários deste
            livro.
          </p>
          <Button
            asChild
            className="mt-2 rounded-xl cursor-pointer"
          >
            <Link href="/auth">Entrar</Link>
          </Button>
        </header>
      </div>
    );
  }

  if (gateLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-7">
        <Skeleton className="mx-auto h-9 w-64 rounded-lg sm:mx-0" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (gateError || !gate) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-7">
        <p className="text-red-600 dark:text-red-400">
          Não foi possível carregar esta leitura coletiva. Tente novamente.
        </p>
      </div>
    );
  }

  if (!gate.canAccess) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-7">
        <h1 className="page-title text-zinc-900 dark:text-zinc-100">
          Leitura coletiva
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Você não tem acesso a este espaço ou este livro não é uma leitura
          coletiva (é necessário haver mais de um leitor no livro).
        </p>
        <Button asChild variant="outline" className="rounded-xl cursor-pointer">
          <Link href="/">Voltar à home</Link>
        </Button>
      </div>
    );
  }

  const headline = gate.bookTitle || title;
  const participantsLabel =
    typeof gate.participantsDisplay === "string"
      ? gate.participantsDisplay.trim()
      : "";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-7">
      <header className="space-y-2">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80">
            <Users
              className="size-6 text-violet-600 dark:text-violet-400"
              aria-hidden
            />
          </div>
          <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
            <h1 className="page-title text-zinc-900 dark:text-zinc-100">
              Leitura coletiva — {headline}
            </h1>
            <p className="max-w-xl text-base text-zinc-600 dark:text-zinc-400">
              Acompanhe onde você está no cronograma e troque ideias com quem
              está lendo o mesmo livro.
            </p>
            {participantsLabel ? (
              <p
                className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-xl border border-violet-200/80 bg-violet-50/80 px-3 py-2 text-left text-sm text-zinc-700 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-zinc-300"
                aria-label={`Participantes da leitura: ${participantsLabel}`}
              >
                <Users
                  className="size-4 shrink-0 text-violet-600 dark:text-violet-400"
                  aria-hidden
                />
                <span className="min-w-0 leading-snug">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Participando:{" "}
                  </span>
                  {participantsLabel}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <Card className="gap-0 overflow-hidden rounded-2xl border-zinc-200 py-0 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <CardHeader className="border-b border-zinc-200 bg-zinc-50/80 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/80 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            <CalendarDays className="size-5 shrink-0 text-zinc-400" aria-hidden />
            Seu próximo passo no cronograma
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-5 sm:px-6">
          {scheduleLoading ? (
            <Skeleton className="h-16 w-full rounded-xl" />
          ) : scheduleChapter?.kind === "active" ? (
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              No seu cronograma ativo, o foco atual é o dia{" "}
              <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                {scheduleChapter.dateLabel}
              </strong>
              : capítulos{" "}
              <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                {scheduleChapter.chaptersLabel}
              </strong>
              .
            </p>
          ) : scheduleChapter?.kind === "completed" ? (
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              Seu cronograma está completo. Último dia registrado:{" "}
              <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                {scheduleChapter.lastDateLabel}
              </strong>{" "}
              (capítulos{" "}
              <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                {scheduleChapter.lastChaptersLabel}
              </strong>
              ).
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              Não há cronograma ativo para você neste livro.{" "}
              <Link
                href={`/schedule/${id}/${encodeURIComponent(headline)}`}
                className="font-medium text-violet-600 underline-offset-2 hover:underline dark:text-violet-400"
              >
                Criar ou ver cronograma
              </Link>
              .
            </p>
          )}
        </CardContent>
      </Card>

      <section
        className="space-y-4"
        aria-labelledby="collective-comments-heading"
      >
        <div className="flex items-center gap-2">
          <MessageCircle
            className="size-5 text-violet-500"
            aria-hidden
          />
          <h2
            id="collective-comments-heading"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
          >
            Comentários
          </h2>
        </div>

        <div className="space-y-3">
          <Textarea
            value={draft}
            onChange={(e) => handleDraftChange(e.target.value)}
            placeholder="Escreva um comentário sobre a leitura…"
            className="min-h-[100px] rounded-xl border-zinc-200 dark:border-zinc-800"
            disabled={isSubmittingComment}
          />
          <Button
            type="button"
            onClick={handleSubmitComment}
            disabled={isSubmittingComment || !draft.trim()}
            className="rounded-xl cursor-pointer"
          >
            {isSubmittingComment ? "Enviando…" : "Publicar comentário"}
          </Button>
        </div>

        {commentsError ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            Não foi possível carregar os comentários.
          </p>
        ) : (
          <CollectiveReadingCommentList
            comments={comments}
            isLoading={commentsLoading}
            currentUserId={userId}
            reactionPendingCommentId={reactionPendingCommentId}
            onRequestDelete={handleOpenDeleteComment}
            onToggleReaction={handleToggleReaction}
          />
        )}
        {deleteCommentId ? (
          <ConfirmDialog
            title="Remover comentário"
            description="Deseja remover este comentário? Essa ação não pode ser desfeita."
            id={deleteCommentId}
            queryKeyToInvalidate="collective-reading-comments"
            onConfirm={confirmDeleteComment}
            open={deleteCommentOpen}
            onOpenChange={handleDeleteCommentOpenChange}
            buttonLabel={deleteCommentPending ? "Removendo…" : "Remover"}
          />
        ) : null}
      </section>
    </div>
  );
}
