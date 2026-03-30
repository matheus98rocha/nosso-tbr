"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import { getGenderLabel } from "@/constants/genders";
import { ReadingRankingSection } from "@/modules/stats/_components/readingRanking/readingRankingSection";
import { BookOpen, FileText, PenLine, Tag } from "lucide-react";

const leitores = ["Matheus", "Fabi", "Barbara"];

const CHART_FILLS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

export type EstatisticaAnual = {
  year: number;
  totalBooks: number;
  totalPages: number;
  mostReadGenre: string;
  mostReadAuthor: string;
};

type EstatisticaColaboracao = {
  readerName: string;
  booksRead: number;
};

type StatsClientProps = {
  yearlyStats: EstatisticaAnual[];
  collaborators: EstatisticaColaboracao[];
  totalBooks: number;
};

type KpiCardProps = {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
};

function KpiCard({ title, value, icon }: KpiCardProps) {
  return (
    <Card className="transition-shadow duration-300 hover:shadow-md">
      <CardContent className="flex flex-row items-center gap-4 pt-6">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary md:size-12"
          aria-hidden
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="mt-1 text-2xl font-bold tabular-nums tracking-tight md:text-3xl">
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsClient({
  yearlyStats,
  collaborators,
  totalBooks,
}: StatsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const readerParam = searchParams.get("reader") ?? leitores[0];
  const [reader, setReader] = useState(readerParam);

  useEffect(() => {
    setReader(readerParam);
  }, [readerParam]);

  function onChange(value: string) {
    router.push(`/stats?reader=${value}`);
  }

  const totalPages = yearlyStats.reduce(
    (acc, s) => acc + (s.totalPages ?? 0),
    0
  );

  const mostReadGenre = yearlyStats[0]?.mostReadGenre ?? "N/A";
  const mostReadAuthor = yearlyStats[0]?.mostReadAuthor ?? "N/A";

  const axisTick = { fill: "var(--muted-foreground)", fontSize: 12 };
  const gridStroke = "var(--border)";

  return (
    <div className="space-y-10 md:space-y-12">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Label
            id="stats-reader-label"
            htmlFor="stats-reader"
            className="text-muted-foreground"
          >
            Leitor
          </Label>
          <Select value={reader} onValueChange={onChange}>
            <SelectTrigger
              id="stats-reader"
              aria-labelledby="stats-reader-label"
              className="min-h-11 w-full min-w-[min(100%,16rem)] cursor-pointer transition-[box-shadow,colors] sm:w-56"
            >
              <SelectValue placeholder="Selecione um leitor" />
            </SelectTrigger>
            <SelectContent>
              {leitores.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Resumo de leitura"
      >
        <KpiCard
          title="Total de livros"
          value={totalBooks}
          icon={<BookOpen className="size-5 md:size-6" strokeWidth={1.75} />}
        />
        <KpiCard
          title="Total de páginas"
          value={totalPages}
          icon={<FileText className="size-5 md:size-6" strokeWidth={1.75} />}
        />
        <KpiCard
          title="Gênero mais lido"
          value={
            mostReadGenre === "N/A" ? (
              <span className="text-xl text-muted-foreground md:text-2xl">
                N/A
              </span>
            ) : (
              getGenderLabel(mostReadGenre)
            )
          }
          icon={<Tag className="size-5 md:size-6" strokeWidth={1.75} />}
        />
        <KpiCard
          title="Autor mais lido"
          value={
            <span className="line-clamp-2 text-xl md:text-2xl">
              {mostReadAuthor}
            </span>
          }
          icon={<PenLine className="size-5 md:size-6" strokeWidth={1.75} />}
        />
      </section>

      <ReadingRankingSection />

      <section
        className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8"
        aria-label="Gráficos"
      >
        <Card className="shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg md:text-xl">Livros por ano</CardTitle>
            <CardDescription>
              Quantidade de livros concluídos em cada ano.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {yearlyStats.length === 0 ? (
              <p className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 text-center text-sm text-muted-foreground">
                Nenhum dado anual disponível para este leitor.
              </p>
            ) : (
              <div className="h-[min(320px,55vw)] w-full min-h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={yearlyStats}
                    margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke={gridStroke}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="year"
                      tick={axisTick}
                      tickLine={false}
                      axisLine={{ stroke: gridStroke }}
                    />
                    <YAxis
                      tick={axisTick}
                      tickLine={false}
                      axisLine={{ stroke: gridStroke }}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--popover-foreground)",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="totalBooks"
                      name="Livros lidos"
                      fill="var(--chart-1)"
                      radius={[6, 6, 0, 0]}
                      label={{
                        position: "top",
                        fill: "var(--foreground)",
                        fontSize: 12,
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg md:text-xl">
              Colaborações de leitura
            </CardTitle>
            <CardDescription>
              Distribuição de livros lidos entre colaboradores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {collaborators.length === 0 ? (
              <p className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 text-center text-sm text-muted-foreground">
                Não há outros leitores com dados de colaboração para exibir.
              </p>
            ) : (
              <div className="h-[min(320px,55vw)] w-full min-h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={collaborators}
                      dataKey="booksRead"
                      nameKey="readerName"
                      cx="50%"
                      cy="50%"
                      outerRadius="78%"
                      innerRadius="42%"
                      paddingAngle={2}
                      labelLine={false}
                      label={({ name, percent }) => {
                        const pct = Math.round((percent ?? 0) * 100);
                        return `${name} (${pct}%)`;
                      }}
                    >
                      {collaborators.map((c, i) => (
                        <Cell
                          key={c.readerName}
                          fill={CHART_FILLS[i % CHART_FILLS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--popover-foreground)",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
