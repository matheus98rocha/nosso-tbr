import { createClient } from "@/lib/supabase/server";
import { EstatisticaAnual, StatsClient } from "@/modules/stats";
import { StatsService } from "@/modules/stats/services/stats.service";
import { CollaborationStatsDomain } from "@/modules/stats/types/stats.types";
import { normalizeStatsReaderOptions } from "@/modules/stats/utils/normalizeStatsReaderOptions";
import { getUsersServer } from "@/services/users/service/getUsersServer.service";

export const dynamic = "force-dynamic";

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ reader?: string }>;
}) {
  const params = await searchParams;

  const supabase = await createClient();
  const service = new StatsService(supabase);

  const users = await getUsersServer();
  const readerOptions = normalizeStatsReaderOptions(users);
  const readerIds = readerOptions.map((reader) => reader.id);
  const defaultReaderId = readerIds[0] ?? "";
  const selectedReaderId =
    params.reader && readerIds.includes(params.reader)
      ? params.reader
      : defaultReaderId;

  const selectedUser = users.find((user) => user.id === selectedReaderId);
  const selectedReaderName = selectedUser?.display_name ?? "";

  const [yearlyStats, collaborationStats] = await Promise.all([
    service.getByReader(selectedReaderId),
    service.getCollaborationStats(selectedReaderId),
  ]);

  const totalBooks =
    collaborationStats.find((s) => s.readerName === selectedReaderName)
      ?.booksRead ?? 0;

  const collaborators = collaborationStats.filter(
    (s) => s.readerName !== selectedReaderName,
  );

  return (
    <main className="mx-auto w-full max-w-7xl">
      <header className="mb-8 border-b border-border pb-8 text-center md:mb-10 md:text-left">
        <h1 className="page-title">Estatísticas de Leitura</h1>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground md:mx-0">
          Visão geral dos livros lidos, páginas e hábitos por leitor. Escolha um
          leitor abaixo para atualizar os gráficos.
        </p>
      </header>

      <StatsClient
        key={selectedReaderId}
        yearlyStats={yearlyStats as EstatisticaAnual[]}
        collaborators={collaborators as CollaborationStatsDomain[]}
        totalBooks={totalBooks}
        readerOptions={readerOptions}
        selectedReaderId={selectedReaderId}
      />
    </main>
  );
}
