import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ScheduleDomain } from "../../types/schedule.types";
import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/deleteModal/deleteModal";

type ScheduleTableProps = {
  schedule?: ScheduleDomain[];
  bookId: string;
  updateIsCompleted: (payload: { id: string; isRead: boolean }) => void;
  deleteSchedule: (id: string) => Promise<void>;
};

export function ScheduleTable({
  schedule,
  bookId,
  updateIsCompleted,
  deleteSchedule,
}: ScheduleTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <DeleteDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        id={bookId}
        onDelete={async (id: string) => {
          await deleteSchedule(id);
          setIsModalOpen(false);
        }}
        queryKeyToInvalidate="schedule"
        title="Deletar Cronograma"
        description="Tem certeza que deseja deletar todo o cronograma? Essa ação não pode ser desfeita."
      />

      <Card className="w-full max-w-2xl mx-auto shadow-2xl h-fit">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-black">
            Cronograma
          </CardTitle>
          <CardAction>
            <Button
              variant="destructive"
              size="sm"
              className="ml-4"
              onClick={() => setIsModalOpen(true)}
            >
              Deletar
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full border-collapse rounded-2xl overflow-hidden shadow-sm">
              <thead className="bg-zinc-100 sticky top-0">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold text-black">
                    Data
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-black">
                    Capítulos
                  </th>
                  <th className="p-3 text-center text-sm font-semibold text-black">
                    Concluído
                  </th>
                </tr>
              </thead>
              <tbody>
                {schedule?.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b border-zinc-200 last:border-none hover:bg-zinc-50 transition"
                  >
                    <td className="p-3 text-sm text-black">
                      {new Date(row.date).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="p-3 text-sm text-black">{row.chapters}</td>
                    <td className="p-3 text-center">
                      <Switch
                        checked={row.completed}
                        onCheckedChange={(checked) =>
                          updateIsCompleted({
                            id: row.id ?? "",
                            isRead: checked,
                          })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
