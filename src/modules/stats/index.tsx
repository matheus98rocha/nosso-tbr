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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "recharts";
import { getGenderLabel } from "@/constants/genders";

const leitores = ["Matheus", "Fabi", "Barbara"];

const CORES = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50"];

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

  return (
    <div className="space-y-8">
      {/* seletor de leitor */}
      <div className="flex justify-center">
        <Select onValueChange={onChange} defaultValue={reader}>
          <SelectTrigger className="w-[180px]">
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

      {/* cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="transition-shadow duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-base font-semibold">
              Total de Livros
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <p className="text-2xl font-bold">{totalBooks}</p>
          </CardContent>
        </Card>

        <Card className="transition-shadow duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-base font-semibold">
              Total de Páginas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <p className="text-2xl font-bold">{totalPages}</p>
          </CardContent>
        </Card>

        <Card className="transition-shadow duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-base font-semibold">
              Gênero Mais Lido
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {mostReadGenre === "N/A" ? (
              <p className="text-lg">N/A</p>
            ) : (
              <span className="px-2 py-1 rounded text-sm font-medium">
                <p className="text-2xl font-bold">
                  {getGenderLabel(mostReadGenre)}
                </p>
              </span>
            )}
          </CardContent>
        </Card>

        <Card className="transition-shadow duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-base font-semibold">
              Autor Mais Lido
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <p className="text-2xl font-bold">{mostReadAuthor}</p>
          </CardContent>
        </Card>
      </div>

      {/* gráfico de barras (livros por ano) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          {" "}
          <CardHeader>
            {" "}
            <CardTitle>Livros por Ano</CardTitle>{" "}
          </CardHeader>{" "}
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearlyStats}>
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="totalBooks"
                  name="Livros Lidos"
                  fill="#8884d8"
                  label={{ position: "top", fill: "#000", fontSize: 14 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* gráfico de pizza (colaborações) */}
        {collaborators.length > 0 && (
          <Card>
            {" "}
            <CardHeader>
              {" "}
              <CardTitle>Colaborações de Leitura</CardTitle>{" "}
            </CardHeader>{" "}
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={collaborators}
                    dataKey="booksRead"
                    nameKey="readerName"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={{
                      position: "insideBottomLeft",
                      fill: "#000",
                      fontSize: 14,
                    }}
                  >
                    {collaborators.map((_, index) => (
                      <Cell key={index} fill={CORES[index % CORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
