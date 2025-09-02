import ClientQuotes from "@/modules/quotes";

export default async function QuotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  console.log(await params);
  return <ClientQuotes id={id} />;
}
