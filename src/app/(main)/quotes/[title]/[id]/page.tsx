import ClientQuotes from "@/modules/quotes";
import { ClientQuotesProps } from "@/modules/quotes/types/quotes.types";

export default async function QuotesPage({
  params,
}: {
  params: Promise<ClientQuotesProps>;
}) {
  const { id, title } = await params;
  const formattedTitle = decodeURIComponent(title);

  return <ClientQuotes id={id} title={formattedTitle} />;
}
