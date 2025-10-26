import { EstatisticaAnual, StatsClient } from "@/modules/stats";
import { StatsService } from "@/modules/stats/services/stats.service";
import { CollaborationStatsDomain } from "@/modules/stats/types/stats.types";

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ reader?: string }>;
}) {
  const params = await searchParams;
  const reader = params.reader ?? "Matheus";

  const service = new StatsService();

  // Executa as duas chamadas em paralelo
  const [yearlyStats, collaborationStats] = await Promise.all([
    service.getByReader(reader),
    service.getCollaborationStats(reader),
  ]);

  // total de livros lidos pelo leitor principal
  const totalBooks =
    collaborationStats.find((s) => s.readerName === reader)?.booksRead ?? 0;

  // colaboradores (remove o leitor principal)
  const collaborators = collaborationStats.filter(
    (s) => s.readerName !== reader
  );

  return (
    <div className="container w-full flex  justify-center flex-col gap-6">
      <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
        Estatísticas de Leitura
      </h1>

      <StatsClient
        yearlyStats={yearlyStats as EstatisticaAnual[]}
        collaborators={collaborators as CollaborationStatsDomain[]}
        totalBooks={totalBooks}
      />
    </div>
  );
}
