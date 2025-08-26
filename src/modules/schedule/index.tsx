"use client";

// import { Switch } from "@/components/ui/switch";
import { CreateScheduleForm } from "./components/createScheduleForm/createScheduleForm";
import { useSchedule } from "./hooks/useSchedule";
import { ClientScheduleProps } from "./types/schedule.types";
// import { Button } from "@/components/ui/button";
import { ScheduleTable } from "./components/scheduleTable/scheduleTable";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientSchedule({
  id,
  startDate,
  title,
}: ClientScheduleProps) {
  const {
    isLoading,
    schedule,
    updateIsCompleted,
    deleteSchedule,
    isPendingDelete,
  } = useSchedule({
    id,
    startDate,
  });

  if (isLoading || isPendingDelete) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-6 animate-pulse">
        {/* Título */}
        <Skeleton className="h-12 w-72 mx-auto rounded" />

        {/* Subtítulo */}
        <Skeleton className="h-4 w-96 mx-auto rounded" />

        {/* Form ou Tabela */}
        <div className="space-y-4 mt-4">
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
        📖 {title}
      </h1>
      <p className="leading-7 [&:not(:first-child)]:mt-6 text-center">
        {schedule && schedule.length > 0
          ? "Crie um cronograma personalizado para organizar melhor a sua leitura."
          : "        Seu cronograma de leitura foi gerado! Acompanhe os capítulos planejados e marque os que você já concluiu."}
      </p>
      <>
        {schedule && schedule.length > 0 ? (
          <ScheduleTable
            schedule={schedule}
            updateIsCompleted={updateIsCompleted}
            deleteSchedule={async (id: string) =>
              deleteSchedule({
                id,
              })
            }
            bookId={id}
          />
        ) : (
          <CreateScheduleForm id={id} startDate={startDate} title={title} />
        )}
      </>
    </div>
  );
}
