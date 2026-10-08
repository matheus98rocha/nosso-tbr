"use client";

import { memo } from "react";

import { DefaultPagination } from "@/components";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  CommunityCounts,
  CommunityMemberRow,
  CommunityReaderModal,
  CommunityRemoveFollowerDialog,
  CommunitySearch,
} from "./components";
import { useCommunity } from "./hooks/useCommunity";
import type { CommunityView } from "./types/community.types";

const VIEW_OPTIONS: { value: CommunityView; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "seguidores", label: "Seguidores" },
  { value: "seguindo", label: "Seguindo" },
  { value: "mutuos", label: "Mútuos" },
];

function emptyCopy(view: CommunityView, hasSearch: boolean): string {
  if (hasSearch) {
    return "Não encontramos nenhum leitor com esse nome.";
  }

  if (view === "seguidores") {
    return "Ninguém te segue ainda.";
  }

  if (view === "seguindo") {
    return "Você ainda não segue ninguém.";
  }

  if (view === "mutuos") {
    return "Ainda não há seguidores mútuos.";
  }

  return "Ainda não há outros leitores por aqui.";
}

function CommunityScreenView() {
  const viewModel = useCommunity();
  const hasSearch = viewModel.searchQuery.trim().length > 0;

  return (
    <div className="relative w-full max-w-6xl space-y-5 sm:space-y-6">
      <header className="relative overflow-hidden rounded-[1.75rem] border border-[color-mix(in_oklch,var(--reading-ink)_12%,transparent)] bg-[var(--reading-surface)] px-4 py-5 sm:px-6 sm:py-7">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,oklch(0.62_0.09_55/0.2),transparent_52%),radial-gradient(ellipse_at_100%_0%,oklch(0.42_0.07_264/0.14),transparent_48%)]"
        />
        <div className="relative flex flex-col items-start gap-6 text-left">
          <div className="max-w-2xl space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color-mix(in_oklch,var(--reading-ink)_58%,transparent)]">
              Sala de leitura
            </p>
            <h1 className="brand-display text-left text-[2.15rem] leading-none font-semibold tracking-tight text-[var(--reading-ink)] sm:text-5xl">
              Comunidade
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-[color-mix(in_oklch,var(--reading-ink)_74%,transparent)] sm:text-base">
              Veja quem você segue, quem te segue e quem lê nos dois sentidos.
              Se alguém não deve mais acompanhar a sua estante, remova o
              seguidor.
            </p>
          </div>
          <CommunityCounts
            followingCount={viewModel.followingCount}
            followerCount={viewModel.followerCount}
            mutualCount={viewModel.mutualCount}
            activeView={viewModel.view}
            onSelectView={viewModel.setView}
          />
        </div>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
          aria-label="Recortes da comunidade"
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:px-0"
        >
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={viewModel.view === option.value}
              onClick={() => viewModel.setView(option.value)}
              className={cn(
                "h-11 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors",
                viewModel.view === option.value
                  ? "border-transparent bg-[var(--reading-ink)] text-[var(--reading-surface)]"
                  : "border-[color-mix(in_oklch,var(--reading-ink)_16%,transparent)] bg-white/80 text-zinc-700 hover:bg-white dark:bg-zinc-950/40 dark:text-zinc-200",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <CommunitySearch
          inputValue={viewModel.inputValue}
          suggestions={viewModel.suggestions}
          isLoadingSuggestions={viewModel.isLoadingSuggestions}
          shouldSearchSuggestions={viewModel.shouldSearchSuggestions}
          onInputChange={viewModel.onSearchInputChange}
          onSubmit={viewModel.onSubmitSearch}
          onSelectSuggestion={viewModel.onSelectSuggestion}
        />
      </div>

      <section aria-labelledby="community-list-heading">
        <h2 id="community-list-heading" className="sr-only">
          Lista de leitores
        </h2>
        {viewModel.isLoading ? (
          <div
            className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4"
            aria-busy="true"
            aria-label="Carregando leitores"
          >
            <Skeleton className="h-36 w-full rounded-[1.35rem]" />
            <Skeleton className="h-36 w-full rounded-[1.35rem]" />
            <Skeleton className="h-36 w-full rounded-[1.35rem]" />
            <Skeleton className="hidden h-36 w-full rounded-[1.35rem] lg:block" />
          </div>
        ) : viewModel.isError ? (
          <div className="space-y-4 rounded-[1.35rem] border border-dashed border-zinc-300 px-4 py-14 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Não foi possível carregar a comunidade. Tente de novo.
            </p>
            <Button
              type="button"
              variant="outline"
              className="h-11 cursor-pointer rounded-xl"
              onClick={viewModel.onRetry}
            >
              Tentar de novo
            </Button>
          </div>
        ) : viewModel.isEmpty ? (
          <div className="space-y-4 rounded-[1.35rem] border border-dashed border-zinc-300 px-4 py-14 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {emptyCopy(viewModel.view, hasSearch)}
            </p>
            {hasSearch ? (
              <Button
                type="button"
                variant="outline"
                className="h-11 cursor-pointer rounded-xl"
                onClick={viewModel.onClearSearch}
                aria-label="Limpar busca de leitores"
              >
                Limpar busca
              </Button>
            ) : null}
          </div>
        ) : (
          <ul
            className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4"
            role="list"
          >
            {viewModel.members.map((member) => (
              <li key={member.id} className="min-w-0">
                <CommunityMemberRow
                  memberId={member.id}
                  displayName={member.displayName}
                  avatarSeed={member.avatarSeed}
                  registeredCount={member.registeredCount}
                  finishedCount={member.finishedCount}
                  currentlyReadingTitle={member.currentlyReadingTitle}
                  isFollowing={member.isFollowing}
                  isFollower={member.isFollower}
                  isToggleBusy={
                    viewModel.isTogglePending &&
                    viewModel.pendingUserId === member.id
                  }
                  isRemoveBusy={
                    viewModel.isRemovePending &&
                    viewModel.pendingRemovalUserId === member.id
                  }
                  onOpen={() => viewModel.onOpenMember(member.id)}
                  onToggleFollow={() => viewModel.onToggleFollow(member.id)}
                  onRemoveFollower={() =>
                    viewModel.onRequestRemoveFollower(member.id)
                  }
                />
              </li>
            ))}
          </ul>
        )}
        <DefaultPagination
          currentPage={viewModel.currentPage}
          totalPages={viewModel.totalPages}
          setCurrentPage={viewModel.onPageChange}
        />
      </section>

      <CommunityReaderModal
        member={viewModel.selectedMember}
        open={Boolean(viewModel.selectedMember)}
        isToggleBusy={
          viewModel.isTogglePending &&
          viewModel.pendingUserId === viewModel.selectedMember?.id
        }
        isRemoveBusy={
          viewModel.isRemovePending &&
          viewModel.pendingRemovalUserId === viewModel.selectedMember?.id
        }
        onOpenChange={(open) => {
          if (!open) {
            viewModel.onCloseMember();
          }
        }}
        onToggleFollow={() => {
          if (viewModel.selectedMember) {
            viewModel.onToggleFollow(viewModel.selectedMember.id);
          }
        }}
        onRemoveFollower={() => {
          if (viewModel.selectedMember) {
            viewModel.onRequestRemoveFollower(viewModel.selectedMember.id);
          }
        }}
        onOpenProfile={() => {
          if (viewModel.selectedMember) {
            viewModel.onOpenMemberProfile(viewModel.selectedMember.id);
          }
        }}
      />

      <CommunityRemoveFollowerDialog
        displayName={viewModel.removalMember?.displayName ?? null}
        open={Boolean(viewModel.removalMember)}
        isPending={viewModel.isRemovePending}
        onOpenChange={(open) => {
          if (!open) {
            viewModel.onCancelRemoveFollower();
          }
        }}
        onConfirm={viewModel.onConfirmRemoveFollower}
      />
    </div>
  );
}

export default memo(CommunityScreenView);
