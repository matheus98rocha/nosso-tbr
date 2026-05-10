import ClientCollectiveReading from "@/modules/collectiveReading";
import type { ClientCollectiveReadingProps } from "@/modules/collectiveReading/types/collectiveReading.types";

export default async function CollectiveReadingPage({
  params,
}: {
  params: Promise<ClientCollectiveReadingProps>;
}) {
  const { id, title: rawTitle } = await params;

  const title = rawTitle ? decodeURIComponent(rawTitle) : "";

  return <ClientCollectiveReading id={id} title={title} />;
}
