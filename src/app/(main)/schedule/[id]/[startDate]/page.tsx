import ClientSchedule from "@/modules/schedule";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ id: string; startDate: string }>;
}) {
  const { id, startDate } = await params;
  return <ClientSchedule id={id} startDate={startDate} />;
}
