"use client";

import { Button } from "@/components/ui/button";
import {
  BookCard,
  DefaultPagination,
  ListGrid,
  StatusFilterChips,
  YearFilterChips,
} from "@/components";
import { BookUpsert } from "@/modules/bookUpsert";
import { useHome } from "@/modules/home/hooks/useHome";
import { useModal } from "@/hooks/useModal";
import { BookDomain } from "../../types/books.types";
import { CreateEditBookshelves } from "../shelves/components/createEditBookshelves";
import { useUserStore } from "@/stores/userStore";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  BookPlus,
  LogInIcon,
  Tag,
  UserPlus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
    handleToggleReader,
    isMyBooksActive,
    isAllBooksActive,
    isLoggedIn,
    checkIsUserActive,
    readers,
  } = useHome();

  const dialogModal = useModal();
  const createShelfDialog = useModal();
  const isLoading = isLoadingAllBooks || isLoggingOut;

  const shouldSuggestFollowing =
    !isLoading &&
    isFetched &&
    !isError &&
    isLoggedIn &&
    isAllBooksActive &&
    (allBooks?.total ?? 0) === 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-7">
      <BookUpsert
        isBookFormOpen={dialogModal.isOpen}
        setIsBookFormOpen={dialogModal.setIsOpen}
      />
      <CreateEditBookshelves
        isOpen={createShelfDialog.isOpen}
        handleClose={createShelfDialog.setIsOpen}
      />

      <header className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1">
            {isLoading ? (
              <Skeleton className="h-full w-40" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {allBooks?.total || 0}
                </span>
                <span className="text-sm font-medium text-zinc-500 uppercase tracking-widest">
                  livros encontrados
                </span>
              </div>
            )}

            {isLoading ? (
              <Skeleton className="h-4 w-56" />
            ) : activeFilterLabels.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400 italic">
                <span>Filtrando por:</span>
                <span className="font-medium text-zinc-600 dark:text-zinc-300 not-italic">
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
          <div className="dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800">
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
                          !isMyBooksActive && !isAllBooksActive
                            ? "bg-violet-600 border-violet-600 text-white hover:bg-violet-700"
                            : "hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 text-zinc-500 border-zinc-100",
                        )}
                        aria-label="Ver leituras conjuntas"
                        aria-pressed={!isMyBooksActive && !isAllBooksActive}
                      >
                        <Users
                          size={13}
                          className={cn(
                            "mr-1.5 transition-colors",
                            !isMyBooksActive && !isAllBooksActive
                              ? "text-white"
                              : "text-zinc-400 group-hover:text-inherit",
                          )}
                        />
                        Leituras Conjuntas
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
                    <div className="flex gap-2 items-start justify-start w-full">
                      {!isMyBooksActive && (
                        <div className="flex gap-2">
                          {readers.map((user) => (
                            <Button
                              key={user.id}
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleReader(user.id)}
                              className={cn(
                                "rounded-full h-8 px-3 text-xs font-medium transition-all",
                                checkIsUserActive(user.id)
                                  ? "bg-violet-600 border-violet-600 text-white hover:bg-violet-700"
                                  : "border-zinc-200 text-zinc-500 hover:border-violet-200 hover:text-violet-600 dark:border-zinc-800",
                              )}
                            >
                              {user.display_name}
                            </Button>
                          ))}
                        </div>
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
              {isLoading ? (
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton
                      key={`year-sk-${i}`}
                      className="h-8 w-16 rounded-full"
                    />
                  ))}
                </div>
              ) : (
                <YearFilterChips
                  activeYear={filters.year}
                  onSelect={handleSetYear}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-2 text-center flex flex-col items-center gap-2">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Quer uma experiência personalizada?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[240px]">
                Faça login para gerenciar sua lista de leitura, acompanhar
                progresso e acessar filtros exclusivos.
              </p>
            </div>

            <div className="w-full pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800/50">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">
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
        )}
      </header>

      {shouldSuggestFollowing ? (
        <div
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-linear-to-b from-zinc-50/80 to-zinc-50/40 dark:from-zinc-900/40 dark:to-zinc-900/20 p-6 sm:p-8 shadow-sm"
          role="region"
          aria-labelledby="empty-suggestions-title"
        >
          <div className="mx-auto max-w-xl text-center space-y-2 mb-8">
            <h3
              id="empty-suggestions-title"
              className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
            >
              Ainda não há livros por aqui
            </h3>
            <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
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
              <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Conectar com amigos
              </h4>
              <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed mb-5 flex-1">
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
              <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Registrar suas leituras
              </h4>
              <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed mb-5 flex-1">
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
        <ListGrid<BookDomain>
          items={allBooks?.data ?? []}
          isLoading={isLoading}
          isFetched={isFetched}
          renderItem={(book) => <BookCard key={book.id} book={book} />}
          emptyMessage="Nenhum livro encontrado para os filtros selecionados."
          isError={isError}
        />
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
