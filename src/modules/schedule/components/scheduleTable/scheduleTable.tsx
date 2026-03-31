import { ConfirmDialog } from "@/components/confirmDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ScheduleReadToggleCell from "@/modules/schedule/components/scheduleTable/ScheduleReadToggleCell";
import { ScheduleTableProps } from "@/modules/schedule/components/scheduleTable/types/scheduleTable.types";
import { CalendarDays, Trash2 } from "lucide-react";
import { useState } from "react";

function formatRowDate(isoDate: string) {
  return isoDate.split("T")[0].split("-").reverse().join("/");
}

export function ScheduleTable({
  schedule,
  bookId,
  updateIsCompleted,
  deleteSchedule,
  isReadTogglePending,
  pendingScheduleId,
}: ScheduleTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <ConfirmDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        id={bookId}
        onConfirm={async (id: string) => {
          await deleteSchedule(id);
          setIsModalOpen(false);
        }}
        queryKeyToInvalidate="schedule"
        title="Deletar Cronograma"
        buttonLabel="Deletar"
        description="Tem certeza que deseja deletar todo o cronograma? Essa ação não pode ser desfeita."
      />

      <Card className="mx-auto h-fit w-full max-w-2xl gap-0 overflow-hidden rounded-2xl border-zinc-200 py-0 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <CardHeader className="border-b border-zinc-200 bg-zinc-50/80 px-5 py-5 dark:border-zinc-800 dark:bg-zinc-900/80 sm:px-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                <CalendarDays
                  className="size-5 shrink-0 text-zinc-400"
                  aria-hidden
                />
                Cronograma
              </CardTitle>
              <CardDescription className="text-sm text-zinc-600 dark:text-zinc-400">
                Marque cada dia como concluído conforme avança na leitura.
              </CardDescription>
            </div>
            <CardAction className="sm:pt-0.5">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="h-9 cursor-pointer gap-1.5 rounded-xl"
                onClick={() => setIsModalOpen(true)}
              >
                <Trash2 className="size-4" aria-hidden />
                Deletar
              </Button>
            </CardAction>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="max-h-[min(420px,60vh)] overflow-x-auto overflow-y-auto">
            <table className="w-full min-w-[320px] border-collapse">
              <thead className="sticky top-0 z-10 bg-zinc-100/95 backdrop-blur-sm dark:bg-zinc-800/95">
                <tr>
                  <th
                    scope="col"
                    className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
                  >
                    Data
                  </th>
                  <th
                    scope="col"
                    className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
                  >
                    Capítulos
                  </th>
                  <th
                    scope="col"
                    className="p-3 text-center text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {schedule?.map((row, index) => {
                  const rowKey = row.id ?? `row-${index}`;
                  const dateLabel = formatRowDate(row.date);
                  const isRowBusy =
                    isReadTogglePending && pendingScheduleId === row.id;

                  return (
                    <tr
                      key={rowKey}
                      className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                    >
                      <td className="whitespace-nowrap p-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {dateLabel}
                      </td>
                      <td className="p-3 text-sm text-zinc-700 dark:text-zinc-300">
                        {row.chapters}
                      </td>
                      <td className="p-3">
                        <ScheduleReadToggleCell
                          checked={row.completed}
                          isBusy={isRowBusy}
                          rowLabel={`dia ${dateLabel}`}
                          onCheckedChange={(checked) =>
                            updateIsCompleted({
                              id: row.id ?? "",
                              isRead: checked,
                            })
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
