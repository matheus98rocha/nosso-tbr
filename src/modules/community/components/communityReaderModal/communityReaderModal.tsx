"use client";

import { memo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getGenderLabel, getGenreBadgeColor } from "@/constants/genders";
import { cn } from "@/lib/utils";
import { ProfileAvatar } from "@/modules/profile/components";
import { initialsFromDisplayName } from "@/modules/profile/utils";

import { shouldShowCommunityLibraryCounts } from "../../utils/communityRelation";
import { formatCommunityMemberActivity } from "../../utils/formatCommunityMemberActivity";
import CommunityRelationMarks from "../communityRelationMarks";
import type { CommunityReaderModalProps } from "./types/communityReaderModal.types";

function CommunityReaderModalComponent({
  member,
  open,
  isToggleBusy,
  isRemoveBusy,
  onOpenChange,
  onToggleFollow,
  onRemoveFollower,
  onOpenProfile,
}: CommunityReaderModalProps) {
  const mostReadLabel = member?.mostReadGender
    ? getGenderLabel(member.mostReadGender)
    : null;
  const mostRegisteredLabel = member?.mostRegisteredGender
    ? getGenderLabel(member.mostRegisteredGender)
    : null;
  const showLibraryCounts = member
    ? shouldShowCommunityLibraryCounts({
        isFollowing: member.isFollowing,
        isFollower: member.isFollower,
      })
    : false;
  const activity = member
    ? formatCommunityMemberActivity({
        registeredCount: member.registeredCount,
        finishedCount: member.finishedCount,
        currentlyReadingTitle: member.currentlyReadingTitle,
      })
    : null;
  const showActivity =
    Boolean(activity?.currentlyReadingLabel) || showLibraryCounts;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {member ? (
          <>
            <DialogHeader className="items-center sm:items-center">
              <ProfileAvatar
                initials={initialsFromDisplayName(member.displayName)}
                avatarSeed={member.avatarSeed}
                size="lg"
                alt={`Avatar de ${member.displayName}`}
                className="mx-auto"
              />
              <DialogTitle className="brand-display pt-2 text-center text-3xl font-semibold">
                {member.displayName}
              </DialogTitle>
              <div className="flex justify-center">
                <CommunityRelationMarks
                  isFollowing={member.isFollowing}
                  isFollower={member.isFollower}
                />
              </div>
              <DialogDescription className="text-center">
                Recorte de gêneros visíveis para você.
              </DialogDescription>
              {showActivity && activity ? (
                <div className="space-y-1 text-center">
                  {showLibraryCounts ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {activity.countsLabel}
                    </p>
                  ) : null}
                  {activity.currentlyReadingLabel ? (
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      {activity.currentlyReadingLabel}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </DialogHeader>
            <dl className="space-y-3">
              <div className="rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
                <dt className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                  Gênero mais lido
                </dt>
                <dd className="mt-2">
                  {mostReadLabel && member.mostReadGender ? (
                    <Badge
                      className={cn(
                        "rounded-md border-0 font-normal",
                        getGenreBadgeColor(member.mostReadGender),
                      )}
                    >
                      {mostReadLabel}
                    </Badge>
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Ainda não há gênero destacado nas leituras finalizadas.
                    </p>
                  )}
                </dd>
              </div>
              <div className="rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
                <dt className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                  Gênero com mais livros cadastrados
                </dt>
                <dd className="mt-2">
                  {mostRegisteredLabel && member.mostRegisteredGender ? (
                    <Badge
                      className={cn(
                        "rounded-md border-0 font-normal",
                        getGenreBadgeColor(member.mostRegisteredGender),
                      )}
                    >
                      {mostRegisteredLabel}
                    </Badge>
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Ainda não há gênero destacado nos livros cadastrados.
                    </p>
                  )}
                </dd>
              </div>
            </dl>
            <DialogFooter className="flex-col gap-2 sm:flex-col sm:justify-stretch">
              <Button
                type="button"
                variant={member.isFollowing ? "secondary" : "default"}
                className="h-11 w-full cursor-pointer rounded-xl"
                disabled={isToggleBusy}
                onClick={onToggleFollow}
                aria-busy={isToggleBusy}
                aria-pressed={member.isFollowing}
                aria-label={
                  member.isFollowing
                    ? `Deixar de seguir ${member.displayName}`
                    : `Seguir ${member.displayName}`
                }
              >
                {member.isFollowing ? "Seguindo" : "Seguir"}
              </Button>
              {member.isFollower ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full cursor-pointer rounded-xl"
                  disabled={isRemoveBusy}
                  onClick={onRemoveFollower}
                  aria-busy={isRemoveBusy}
                  aria-label={`Remover ${member.displayName} dos seguidores`}
                >
                  Remover
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full cursor-pointer rounded-xl"
                onClick={onOpenProfile}
              >
                Ver perfil
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default memo(CommunityReaderModalComponent);
