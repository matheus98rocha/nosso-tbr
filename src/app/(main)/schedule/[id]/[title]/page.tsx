import ClientSchedule from "@/modules/schedule";
import { ClientScheduleProps } from "@/modules/schedule/types/schedule.types";

export default async function SchedulePage({
  params,
}: {
  params: Promise<ClientScheduleProps>;
}) {
  const { id, title: rawTitle } = await params;

  const title = rawTitle ? decodeURIComponent(rawTitle) : "";

  return <ClientSchedule id={id} title={title} />;
}
