"use client";

import { CreateScheduleForm } from "./components/createScheduleForm";
import { useSchedule } from "./hooks";
import { ClientScheduleProps } from "./types/schedule.types";
import { ScheduleTable } from "./components/scheduleTable";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserStore } from "@/stores/userStore";
import { BookOpen } from "lucide-react";

export default function ClientSchedule({ id, title }: ClientScheduleProps) {
  const {
    schedule,
    updateIsCompleted,
    deleteSchedule,
    isLoadingSchedule,
    shouldDisplayScheduleTable,
    emptySchedule,
    isReadTogglePending,
    pendingScheduleId,
  } = useSchedule({
    id,
  });

  const { user } = useUserStore();

  if (isLoadingSchedule || user?.id === undefined || user.id === null) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-7">
        <div className="space-y-3">
          <Skeleton className="mx-auto h-9 w-56 rounded-lg sm:mx-0" />
          <Skeleton className="mx-auto h-4 max-w-md rounded sm:mx-0" />
        </div>
        <Skeleton className="h-[min(420px,50vh)] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-7">
      <header className="space-y-2">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80">
            <BookOpen
              className="size-6 text-zinc-700 dark:text-zinc-200"
              aria-hidden
            />
          </div>
          <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
            <h1 className="page-title text-zinc-900 dark:text-zinc-100">
              {decodeURIComponent(title)}
            </h1>
            <p className="max-w-xl text-base text-zinc-600 dark:text-zinc-400">
              {emptySchedule
                ? "Crie um cronograma personalizado para organizar melhor a sua leitura."
                : "Seu cronograma foi gerado. Acompanhe os capítulos e marque o que já leu — as alterações aparecem na hora."}
            </p>
          </div>
        </div>
      </header>

      {shouldDisplayScheduleTable ? (
        <ScheduleTable
          schedule={schedule}
          updateIsCompleted={updateIsCompleted}
          deleteSchedule={async (scheduleBookId: string) =>
            deleteSchedule({
              id: scheduleBookId,
            })
          }
          bookId={id}
          isReadTogglePending={isReadTogglePending}
          pendingScheduleId={pendingScheduleId}
        />
      ) : (
        <CreateScheduleForm id={id} title={title} />
      )}
    </div>
  );
}
