"use client";

import { Search } from "lucide-react";
import { memo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  CommunityCounts,
  CommunityMemberRow,
  CommunityReaderModal,
} from "./components";
import { useCommunity } from "./hooks/useCommunity";
import type { CommunityView } from "./types/community.types";

const VIEW_OPTIONS: { value: CommunityView; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "seguidores", label: "Seguidores" },
  { value: "seguindo", label: "Seguindo" },
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

  return "Ainda não há outros leitores por aqui.";
}

function CommunityScreenView() {
  const viewModel = useCommunity();
  const hasSearch = viewModel.searchQuery.trim().length > 0;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-7">
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="page-title text-zinc-900 dark:text-zinc-100">
          Comunidade
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Descubra outros leitores, veja um recorte de gêneros e siga quem fizer
          sentido para a sua estante.
        </p>
      </header>

      <CommunityCounts
        followingCount={viewModel.followingCount}
        followerCount={viewModel.followerCount}
        activeView={viewModel.view}
        onSelectView={viewModel.setView}
      />

      <div
        role="tablist"
        aria-label="Recortes da comunidade"
        className="flex flex-wrap gap-2"
      >
        {VIEW_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={viewModel.view === option.value}
            onClick={() => viewModel.setView(option.value)}
            className={cn(
              "h-11 min-w-11 cursor-pointer rounded-xl border px-4 text-sm font-medium transition-colors",
              viewModel.view === option.value
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
          aria-hidden
        />
        <Input
          type="search"
          value={viewModel.searchQuery}
          onChange={(event) => viewModel.onSearchChange(event.target.value)}
          placeholder="Buscar por nome..."
          className="h-11 rounded-xl border-zinc-200 pl-10 text-base md:text-sm dark:border-zinc-800"
          aria-label="Buscar leitores por nome"
          autoComplete="off"
        />
      </div>

      <section
        className="overflow-hidden rounded-2xl border border-zinc-200 shadow-sm dark:border-zinc-800"
        aria-labelledby="community-list-heading"
      >
        <h2 id="community-list-heading" className="sr-only">
          Lista de leitores
        </h2>
        {viewModel.isLoading ? (
          <div className="space-y-3 p-4" aria-busy="true" aria-label="Carregando leitores">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : viewModel.isError ? (
          <div className="space-y-4 px-4 py-12 text-center">
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
          <div className="space-y-4 px-4 py-12 text-center">
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
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800" role="list">
            {viewModel.members.map((member) => (
              <li key={member.id}>
                <CommunityMemberRow
                  memberId={member.id}
                  displayName={member.displayName}
                  avatarSeed={member.avatarSeed}
                  registeredCount={member.registeredCount}
                  finishedCount={member.finishedCount}
                  currentlyReadingTitle={member.currentlyReadingTitle}
                  isFollowing={member.isFollowing}
                  isToggleBusy={
                    viewModel.isTogglePending &&
                    viewModel.pendingUserId === member.id
                  }
                  onOpen={() => viewModel.onOpenMember(member.id)}
                  onToggleFollow={() => viewModel.onToggleFollow(member.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <CommunityReaderModal
        member={viewModel.selectedMember}
        open={Boolean(viewModel.selectedMember)}
        isToggleBusy={
          viewModel.isTogglePending &&
          viewModel.pendingUserId === viewModel.selectedMember?.id
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
        onOpenProfile={() => {
          if (viewModel.selectedMember) {
            viewModel.onOpenMemberProfile(viewModel.selectedMember.id);
          }
        }}
      />
    </div>
  );
}

export default memo(CommunityScreenView);
