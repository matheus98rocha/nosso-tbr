import { StatsClient } from "@/modules/stats";
import { StatsService } from "@/modules/stats/services/stats.service";
import {
  StatsDomain,
  CollaborationStatsDomain,
} from "@/modules/stats/types/stats.types";

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ reader?: string }>;
}) {
  const params = await searchParams;
  const reader = params.reader ?? "Matheus";

  const service = new StatsService();

  // Executa as duas chamadas de serviço em paralelo para maior eficiência
  const [yearlyStats, collaborationStats] = await Promise.all([
    service.getByReader(reader),
    service.getCollaborationStats(reader),
  ]);

  // A primeira entrada da lista de colaboração é sempre a contagem total do leitor principal
  const totalBooks = collaborationStats.find(
    (s) => s.readerName === reader
  )?.booksRead;

  // Filtra o leitor principal da lista de colaboração para exibir apenas os parceiros
  const collaborators = collaborationStats.filter(
    (s) => s.readerName !== reader
  );

  return (
    <main>
      <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
        Estatísticas de Leitura
      </h1>
      <StatsClient />
      <ul>
        {totalBooks !== undefined && (
          <li>
            **{reader} leu {totalBooks} livros no total.**
          </li>
        )}
        {collaborators.length > 0 && (
          <>
            <li>**Colaborações de Leitura:**</li>
            {collaborators.map((s: CollaborationStatsDomain) => (
              <li key={s.readerName}>
                Você leu **{s.booksRead} livros com {s.readerName}**.
              </li>
            ))}
          </>
        )}
      </ul>
      <ul>
        {/* Renderiza as estatísticas anuais como antes */}
        {yearlyStats.map((stat: StatsDomain) => (
          <li key={stat.year}>
            Em {stat.year} você leu {stat.totalBooks} livros
          </li>
        ))}
        <li>
          O gênero que você mais leu foi{" "}
          {yearlyStats[0]?.mostReadGenre ?? "N/A"}
        </li>
        <li>
          Você leu{" "}
          {yearlyStats.reduce(
            (acc: number, s: StatsDomain) => acc + (s.totalPages ?? 0),
            0
          )}{" "}
          páginas de livros
        </li>
        <li>O autor mais lido é {yearlyStats[0]?.mostReadAuthor ?? "N/A"}</li>
      </ul>
    </main>
  );
}
