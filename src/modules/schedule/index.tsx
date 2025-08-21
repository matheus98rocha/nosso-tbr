"use client";

import { CreateScheduleForm } from "./components/createScheduleForm/createScheduleForm";
import { useSchedule } from "./hooks/useSchedule";
import { ClientScheduleProps } from "./types/schedule.types";

export default function ClientSchedule({ id, startDate }: ClientScheduleProps) {
  const { isLoading, schedule } = useSchedule({ id, startDate });

  if (isLoading) return <p>Carregando...</p>;

  return (
    <div>
      {schedule && schedule.length > 0 ? (
        <div>
          <h2 className="text-lg font-bold mb-4">Cronograma existente</h2>
          <ul className="flex flex-col gap-2">
            {schedule.map((day, index) => (
              <li key={index}>
                <strong>{new Date(day.date).toLocaleDateString()}:</strong>{" "}
                {day.chapters}
                {day.completed ? "Concluído" : "Pendente"}
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
