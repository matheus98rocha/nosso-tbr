"use client";
import { useQuery } from "@tanstack/react-query";
import { CreateScheduleForm } from "./components/createScheduleForm/createScheduleForm";
import { ScheduleUpsertService } from "./services/schedule.service";

export type ClientScheduleProps = { id: string; startDate: string };

export default function ClientSchedule({ id, startDate }: ClientScheduleProps) {
  const scheduleService = new ScheduleUpsertService();

  const { data: schedule, isLoading } = useQuery({
    queryKey: ["schedule", id],
    queryFn: () => scheduleService.getByBookId(id),
  });

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
