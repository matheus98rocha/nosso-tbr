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
    <main className="mx-auto w-full max-w-7xl">
      <header className="mb-8 border-b border-border pb-8 text-center md:mb-10 md:text-left">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Estatísticas de Leitura
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground md:mx-0">
          Visão geral dos livros lidos, páginas e hábitos por leitor. Escolha um
          leitor abaixo para atualizar os gráficos.
        </p>
      </header>

      <StatsClient
        yearlyStats={yearlyStats as EstatisticaAnual[]}
        collaborators={collaborators as CollaborationStatsDomain[]}
        totalBooks={totalBooks}
      />
    </main>
  );
}
