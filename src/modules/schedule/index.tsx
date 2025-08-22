"use client";

import { Switch } from "@/components/ui/switch";
import { CreateScheduleForm } from "./components/createScheduleForm/createScheduleForm";
import { useSchedule } from "./hooks/useSchedule";
import { ClientScheduleProps } from "./types/schedule.types";
import { Button } from "@/components/ui/button";

export default function ClientSchedule({ id, startDate }: ClientScheduleProps) {
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

  if (isLoading || isPendingDelete) return <p>Carregando...</p>;

  return (
    <div>
      {schedule && schedule.length > 0 ? (
        <div>
          <h2 className="text-lg font-bold mb-4">
            ADICIONAR NOME DO LIVRO AQUI
          </h2>
          <Button
            onClick={() => deleteSchedule({ id })}
            variant={"destructive"}
          >
            Deletar Cronograma
          </Button>
          <ul className="flex flex-col gap-2">
            {schedule.map((day, index) => (
              <li key={index} className="flex items-center gap-2">
                <div>
                  <strong>{new Date(day.date).toLocaleDateString()}:</strong>{" "}
                  {day.chapters}
                </div>
                <Switch
                  checked={day.completed}
                  onCheckedChange={(checked) =>
                    updateIsCompleted({ id: day.id ?? "", isRead: checked })
                  }
                />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <CreateScheduleForm id={id} startDate={startDate} />
      )}
    </div>
  );
}
