"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  ArrowDownUp,
  BookOpen,
  BookPlus,
  LogInIcon,
  Radar,
  Tag,
  UserPlus,
  Users,
} from "lucide-react";

import {
  BookCard,
  DefaultPagination,
  ListGrid,
  SortFilterChips,
  StatusFilterChips,
  YearFilterChips,
} from "@/components";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FAB_CONTENT_PADDING_CLASS } from "@/constants/floatingActionButton";
import { useModal } from "@/hooks";
import { cn } from "@/lib/utils";
import { AiRecommendationDialog } from "@/modules/aiRecommendation";
import type { BookSuggestion } from "@/modules/aiRecommendation";
import { BookUpsert } from "@/modules/bookUpsert";
import CollapsibleBookFilters from "@/modules/home/components/collapsibleBookFilters";
import HomeQuickActions from "@/modules/home/components/homeQuickActions";
import ReadingNow from "@/modules/home/components/readingNow";
import { useHome } from "@/modules/home/hooks/useHome";
import { ScheduleProgressBatchContext } from "@/modules/schedule/context/scheduleProgressBatchContext";
import { useUserStore } from "@/stores/userStore";

import { BookDomain } from "../../types/books.types";
import { CreateEditBookshelves } from "../shelves/components/createEditBookshelves";

export default function ClientHome() {
  const isLoggingOut = useUserStore((state) => state.isLoggingOut);
  const {
    allBooks,
    isLoadingAllBooks,
    isFetched,
    isError,
    handleClearAllFilters,
    filters,
    currentPage,
    setCurrentPage,
    activeStatuses,
    handleToggleStatus,
    handleSetYear,
    canClear,
    activeFilterLabels,
    totalPages,
    handleToggleMyBooks,
    handleSetAllBooks,
    handleSetJointReading,
    handleSetFollowingFeed,
    handleToggleReader,
    handleSetSort,
    isMyBooksActive,
    isAllBooksActive,
    isFollowingFeedActive,
    followingFeedEmpty,
    isLoggedIn,
    checkIsUserActive,
    readers,
    lockedReaderId,
    needsExtraReader,
    readingProgressBatch,
  } = useHome();

  const dialogModal = useModal();
  const editBookDialog = useModal();
  const createShelfDialog = useModal();
  const aiRecommendationModal = useModal();
  const [aiPrefilledTitle, setAiPrefilledTitle] = useState<string | null>(null);
  const [editingBook, setEditingBook] = useState<BookDomain | null>(null);
  const isLoading = isLoadingAllBooks || isLoggingOut;

  const isJointViewActive = filters.view === "joint" && !isMyBooksActive;

  const shouldSuggestFollowing =
    !isLoading &&
    isFetched &&
    !isError &&
    isLoggedIn &&
    isAllBooksActive &&
    (allBooks?.total ?? 0) === 0;

  const handleBookFormOpenChange = useCallback(
    (open: boolean) => {
      dialogModal.setIsOpen(open);
      if (!open) setAiPrefilledTitle(null);
    },
    [dialogModal],
  );

  const handlePickAiSuggestion = useCallback(
    (suggestion: BookSuggestion) => {
      setAiPrefilledTitle(suggestion.title);
      dialogModal.setIsOpen(true);
    },
    [dialogModal],
  );

  const handleEditBookOpenChange = useCallback(
    (open: boolean) => {
      editBookDialog.setIsOpen(open);
      if (!open) setEditingBook(null);
    },
    [editBookDialog],
  );

  const handleEditBook = useCallback(
    (book: BookDomain) => {
      setEditingBook(book);
      editBookDialog.setIsOpen(true);
    },
    [editBookDialog],
  );

  return (
    <div
      className={cn(
        "home-atmosphere mx-auto w-full max-w-7xl px-4 py-7",
        isLoggedIn && FAB_CONTENT_PADDING_CLASS,
      )}
    >
      <BookUpsert
        isBookFormOpen={dialogModal.isOpen}
        setIsBookFormOpen={handleBookFormOpenChange}
        initialLookupQuery={aiPrefilledTitle}
      />
      <BookUpsert
        isBookFormOpen={editBookDialog.isOpen}
        setIsBookFormOpen={handleEditBookOpenChange}
        bookData={editingBook ?? undefined}
      />
      <CreateEditBookshelves
        isOpen={createShelfDialog.isOpen}
        handleClose={createShelfDialog.setIsOpen}
      />
      <AiRecommendationDialog
        isOpen={aiRecommendationModal.isOpen}
        onOpenChange={aiRecommendationModal.setIsOpen}
        onPickSuggestion={handlePickAiSuggestion}
      />
      {isLoggedIn && (
        <HomeQuickActions
          onAddBook={() => dialogModal.setIsOpen(true)}
          onRequestRecommendation={() => aiRecommendationModal.open()}
        />
      )}

      <header className="mb-5 flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            {isLoading ? (
              <Skeleton className="h-full w-40" />
            ) : (
              <div className="flex items-baseline gap-2.5">
                <span className="brand-display page-title tabular-nums text-[oklch(0.22_0.05_264)] dark:text-zinc-100">
                  {allBooks?.total || 0}
                </span>
                <span className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                  livros encontrados
                </span>
              </div>
            )}

            {isLoading ? (
              <Skeleton className="h-4 w-56" />
            ) : activeFilterLabels.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground italic">
                <span>Filtrando por:</span>
                <span className="font-medium text-foreground not-italic">
                  {activeFilterLabels.join(" • ")}
                </span>
              </div>
            ) : null}
          </div>

          {!isLoading && canClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAllFilters}
              className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 self-start sm:self-auto"
              aria-label="Limpar todos os filtros"
            >
              Limpar tudo
            </Button>
          )}
        </div>
        {isLoggedIn ? (
          <CollapsibleBookFilters activeFilterLabels={activeFilterLabels}>
            <div className="p-4 space-y-2.5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
                <Users size={11} />
                Visão
              </p>
              <div className="flex items-start justify-start gap-2 ">
                {isLoading ? (
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-40 rounded-full" />
                    {isLoggedIn && (
                      <Skeleton className="h-8 w-28 rounded-full" />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSetAllBooks}
                        className={cn(
                          "rounded-full h-8 px-4 text-xs font-medium transition-all duration-200 border shadow-sm group",
                          isAllBooksActive
                            ? "bg-violet-600 border-violet-600 text-white hover:bg-violet-700"
                            : "hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 text-zinc-500 border-zinc-100",
                        )}
                        aria-label="Ver todos os livros relacionados"
                        aria-pressed={isAllBooksActive}
                      >
                        Todos
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSetJointReading}
                        className={cn(
                          "rounded-full h-8 px-4 text-xs font-medium transition-all duration-200 border shadow-sm group",
                          isJointViewActive
                            ? "bg-violet-600 border-violet-600 text-white hover:bg-violet-700"
                            : "hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 text-zinc-500 border-zinc-100",
                        )}
                        aria-label="Ver leituras conjuntas"
                        aria-pressed={isJointViewActive}
                      >
                        <Users
                          size={13}
                          className={cn(
                            "mr-1.5 transition-colors",
                            isJointViewActive
                              ? "text-white"
                              : "text-zinc-400 group-hover:text-inherit",
                          )}
                        />
                        Leituras Conjuntas
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSetFollowingFeed}
                        className={cn(
                          "rounded-full h-8 px-4 text-xs font-medium transition-all duration-200 border shadow-sm group",
                          isFollowingFeedActive
                            ? "bg-violet-600 border-violet-600 text-white hover:bg-violet-700"
                            : "hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 text-zinc-500 border-zinc-100",
                        )}
                        aria-label="Ver livros de perfis que você segue"
                        aria-pressed={isFollowingFeedActive}
                      >
                        <Radar
                          size={13}
                          className={cn(
                            "mr-1.5 transition-colors",
                            isFollowingFeedActive
                              ? "text-white"
                              : "text-zinc-400 group-hover:text-inherit",
                          )}
                        />
                        Seguindo
                      </Button>

                      {isLoggedIn && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleToggleMyBooks}
                          className={cn(
                            "rounded-full h-8 px-4 text-xs font-medium transition-all duration-200 border shadow-sm group",
                            isMyBooksActive
                              ? "bg-violet-600 border-violet-600 text-white hover:bg-violet-700"
                              : "hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 text-zinc-500 border-zinc-100",
                          )}
                          aria-label="Filtrar meus livros"
                          aria-pressed={isMyBooksActive}
                        >
                          <BookOpen
                            size={13}
                            className={cn(
                              "mr-1.5 transition-colors",
                              isMyBooksActive
                                ? "text-white"
                                : "text-zinc-400 group-hover:text-inherit",
                            )}
                          />
                          Meus Livros
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 items-start justify-start w-full">
                      {!isMyBooksActive && !isAllBooksActive && (
                        <>
                          <div className="flex flex-wrap gap-2">
                            {followingFeedEmpty ? (
                              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-md">
                                Você ainda não segue ninguém. Em{" "}
                                <Link
                                  href="/profile"
                                  className="text-violet-600 dark:text-violet-400 font-medium underline-offset-2 hover:underline"
                                >
                                  Perfil
                                </Link>{" "}
                                você encontra pessoas para seguir e acompanhar
                                leituras.
                              </p>
                            ) : (
                              readers.map((reader) => {
                                const isLocked = reader.id === lockedReaderId;
                                const isActive = checkIsUserActive(reader.id);
                                return (
                                  <Button
                                    key={reader.id}
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleToggleReader(reader.id)
                                    }
                                    disabled={isLocked}
                                    aria-pressed={isActive}
                                    aria-label={
                                      isLocked
                                        ? `${reader.display_name} (sempre incluído nesta visão)`
                                        : reader.display_name
                                    }
                                    className={cn(
                                      "rounded-full h-8 px-3 text-xs font-medium transition-all",
                                      isActive
                                        ? "bg-violet-600 border-violet-600 text-white hover:bg-violet-700"
                                        : "border-zinc-200 text-zinc-500 hover:border-violet-200 hover:text-violet-600 dark:border-zinc-800",
                                      isLocked &&
                                        "opacity-100 cursor-not-allowed disabled:opacity-100 disabled:pointer-events-none",
                                    )}
                                  >
                                    {reader.display_name}
                                  </Button>
                                );
                              })
                            )}
                          </div>

                          {isFollowingFeedActive && !followingFeedEmpty && (
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-snug">
                              Leituras privadas só de quem você segue não
                              aparecem aqui.
                            </p>
                          )}

                          {lockedReaderId && (
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-snug">
                              {needsExtraReader ? (
                                <span className="text-amber-500 dark:text-amber-400 font-medium">
                                  Selecione pelo menos outro(a) leitor(a) para
                                  ver leituras conjuntas.
                                </span>
                              ) : (
                                "Você é sempre incluído. Selecione pelo menos outro(a) leitor(a) além de você."
                              )}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 space-y-2.5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
                <Tag size={11} />
                Status de leitura
              </p>
              {isLoading ? (
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton
                      key={`status-sk-${i}`}
                      className="h-8 w-28 rounded-full"
                    />
                  ))}
                </div>
              ) : (
                <StatusFilterChips
                  activeStatuses={activeStatuses}
                  onToggle={handleToggleStatus}
                />
              )}
            </div>

            <div className="p-4">
              <YearFilterChips
                activeYear={filters.year}
                onSelect={handleSetYear}
                isLoading={isLoading}
              />
            </div>

            <div className="p-4 space-y-2.5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
                <ArrowDownUp size={11} />
                Ordenação
              </p>
              <SortFilterChips
                activeSort={filters.sort}
                onSelect={handleSetSort}
                isLoading={isLoading}
              />
            </div>
          </CollapsibleBookFilters>
        ) : null}

        {!isLoggedIn ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-[oklch(0.22_0.05_264/0.12)] bg-[oklch(0.22_0.05_264/0.03)] p-3 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="space-y-1">
              <h2 className="brand-display text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Quer uma experiência personalizada?
              </h2>
              <p className="max-w-[240px] text-xs text-zinc-600 dark:text-zinc-300">
                Faça login para gerenciar sua lista de leitura, acompanhar
                progresso e acessar filtros exclusivos.
              </p>
            </div>

            <div className="mt-2 w-full border-t border-[oklch(0.22_0.05_264/0.1)] pt-2 dark:border-zinc-800/50">
              <p className="mb-2 text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                Não possui uma conta?
              </p>
              <Link
                href="/auth"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer mb-8 group"
              >
                <LogInIcon className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                Logar
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      {isLoggedIn && <ReadingNow className="mb-5 max-w-2xl" />}

      {shouldSuggestFollowing ? (
        <div
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-linear-to-b from-zinc-50/80 to-zinc-50/40 dark:from-zinc-900/40 dark:to-zinc-900/20 p-6 sm:p-8 shadow-sm"
          role="region"
          aria-labelledby="empty-suggestions-title"
        >
          <div className="mx-auto max-w-xl text-center space-y-2 mb-8">
            <h2
              id="empty-suggestions-title"
              className="brand-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
            >
              Ainda não há livros por aqui
            </h2>
            <p className="text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Pode ser combinação dos filtros ou ainda pouca atividade na sua
              rede. Escolha um caminho abaixo — os dois ajudam a preencher sua
              lista com boas leituras.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 max-w-3xl mx-auto">
            <div className="flex flex-col rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/50 p-5 sm:p-6 text-left shadow-xs transition-colors hover:border-violet-200 dark:hover:border-violet-900/60">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/80 dark:text-violet-300 mb-4">
                <UserPlus className="size-5" aria-hidden />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Conectar com amigos
              </h3>
              <p className="text-base text-zinc-700 dark:text-zinc-300 leading-relaxed mb-5 flex-1">
                No perfil você encontra pessoas para seguir e acompanha o que
                elas estão lendo.
              </p>
              <Button
                asChild
                variant="outline"
                className="min-h-11 w-full justify-center gap-2 border-violet-200 text-violet-800 hover:bg-violet-50 hover:text-violet-900 dark:border-violet-800/60 dark:text-violet-200 dark:hover:bg-violet-950/50 cursor-pointer transition-colors"
              >
                <Link
                  href="/profile"
                  aria-label="Abrir perfil para encontrar e seguir amigos"
                >
                  <UserPlus className="size-4 shrink-0" aria-hidden />
                  Ir ao perfil
                </Link>
              </Button>
            </div>

            <div className="flex flex-col rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/50 p-5 sm:p-6 text-left shadow-xs transition-colors hover:border-violet-200 dark:hover:border-violet-900/60">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 mb-4">
                <BookPlus className="size-5" aria-hidden />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Registrar suas leituras
              </h3>
              <p className="text-base text-zinc-700 dark:text-zinc-300 leading-relaxed mb-5 flex-1">
                Cadastre títulos que você quer ler ou já leu — sua lista fica só
                sua, do jeito que preferir.
              </p>
              <Button
                className="min-h-11 w-full justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white cursor-pointer transition-colors"
                onClick={() => dialogModal.setIsOpen(true)}
                aria-label="Abrir formulário para adicionar livros à sua lista"
              >
                <BookPlus className="size-4 shrink-0" aria-hidden />
                Adicionar livros
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <ScheduleProgressBatchContext.Provider value={readingProgressBatch}>
          <ListGrid<BookDomain>
            items={allBooks?.data ?? []}
            isLoading={isLoading}
            isFetched={isFetched}
            renderItem={(book) => (
              <BookCard
                key={book.id}
                book={book}
                isShelf={false}
                onEditBook={() => handleEditBook(book)}
              />
            )}
            emptyMessage={
              filters.bookId?.trim()
                ? "Não encontramos um livro com este identificador na sua lista."
                : followingFeedEmpty
                  ? "Siga outros leitores pelo perfil para ver livros nesta visão."
                  : "Nenhum livro encontrado para os filtros selecionados."
            }
            isError={isError}
          />
        </ScheduleProgressBatchContext.Provider>
      )}

      {!isLoading && totalPages > 1 && (
        <div className="mt-10">
          <DefaultPagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
