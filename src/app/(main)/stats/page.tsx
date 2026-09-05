import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { EstatisticaAnual, StatsClient } from "@/modules/stats";
import { StatsService } from "@/modules/stats/services/stats.service";
import { CollaborationStatsDomain } from "@/modules/stats/types/stats.types";
import { getCurrentUser } from "@/services/users/service/getCurrentUser.service";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  const supabase = await createClient();
  const service = new StatsService(supabase);
  const readerId = user.id;

  const [yearlyStats, collaborationStats] = await Promise.all([
    service.getByReader(readerId),
    service.getCollaborationStats(readerId),
  ]);

  const safeYearlyStats = yearlyStats ?? [];
  const safeCollaborationStats = collaborationStats ?? [];

  const totalBooks = safeYearlyStats.reduce(
    (acc, row) => acc + (row.totalBooks ?? 0),
    0,
  );

  const collaborators = safeCollaborationStats.slice(1);

  return (
    <main className="mx-auto w-full max-w-7xl">
      <header className="mb-8 border-b border-border pb-8 text-center md:mb-10 md:text-left">
        <h1 className="page-title">Estatísticas de Leitura</h1>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground md:mx-0">
          Visão geral dos seus livros lidos, páginas e hábitos. Comparações e
          ranking consideram apenas leitores com quem você se segue mutuamente.
        </p>
      </header>

      <StatsClient
        yearlyStats={safeYearlyStats as EstatisticaAnual[]}
        collaborators={collaborators as CollaborationStatsDomain[]}
        totalBooks={totalBooks}
      />
    </main>
  );
}
