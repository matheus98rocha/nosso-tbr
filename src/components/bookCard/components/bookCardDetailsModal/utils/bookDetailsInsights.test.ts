import { describe, expect, it } from "vitest";

import {
  buildBookReadingInsights,
  buildBookReference,
  buildBookTimeline,
  splitReaderLabels,
} from "./bookDetailsInsights";

const now = new Date(2026, 9, 3);

describe("buildBookReadingInsights", () => {
  it("estima a leitura confortável de um livro ainda não iniciado", () => {
    const insights = buildBookReadingInsights(
      {
        pages: 656,
        status: "planned",
        start_date: null,
        end_date: null,
        planned_start_date: null,
      },
      now,
    );

    expect(insights).toEqual([
      {
        id: "pages",
        label: "Páginas",
        value: "656",
        hint: "do volume",
      },
      {
        id: "forecast",
        label: "Previsão",
        value: "22 dias",
        hint: "30 pág./dia",
      },
    ]);
  });

  it("mostra atraso quando o início planejado já passou", () => {
    const insights = buildBookReadingInsights(
      {
        pages: 90,
        status: "not_started",
        start_date: null,
        end_date: null,
        planned_start_date: "2026-10-01",
      },
      now,
    );

    expect(insights.find((item) => item.id === "delay")).toEqual({
      id: "delay",
      label: "Atraso",
      value: "há 2 dias",
      hint: "início previsto",
    });
  });

  it("calcula duração inclusiva e ritmo médio de uma leitura em andamento", () => {
    const insights = buildBookReadingInsights(
      {
        pages: 300,
        status: "reading",
        start_date: "2026-10-01",
        end_date: null,
        planned_start_date: null,
      },
      now,
    );

    expect(insights.find((item) => item.id === "duration")?.value).toBe("3 dias");
    expect(insights.find((item) => item.id === "pace")?.value).toBe(
      "100 pág./dia",
    );
    expect(insights.some((item) => item.id === "forecast")).toBe(false);
  });

  it("usa a data de término para a duração de uma leitura finalizada", () => {
    const insights = buildBookReadingInsights(
      {
        pages: 10,
        status: "finished",
        start_date: "2026-10-01",
        end_date: "2026-10-02",
        planned_start_date: null,
      },
      now,
    );

    expect(insights.find((item) => item.id === "duration")).toMatchObject({
      label: "Duração",
      value: "2 dias",
    });
    expect(insights.find((item) => item.id === "pace")?.value).toBe(
      "5 pág./dia",
    );
  });

  it("anuncia início para amanhã sem tratar como atraso", () => {
    const insights = buildBookReadingInsights(
      {
        pages: 30,
        status: "planned",
        start_date: null,
        end_date: null,
        planned_start_date: "2026-10-04",
      },
      now,
    );

    expect(insights.find((item) => item.id === "countdown")?.value).toBe(
      "Amanhã",
    );
    expect(insights.find((item) => item.id === "forecast")?.value).toBe("1 dia");
  });
});

describe("buildBookReference", () => {
  it("monta a referência com páginas", () => {
    expect(
      buildBookReference({
        title: "A Fúria dos Reis",
        author: "George R. R. Martin",
        pages: 656,
      }),
    ).toBe("A Fúria dos Reis — George R. R. Martin · 656 pág.");
  });

  it("omite páginas quando o volume não tem contagem", () => {
    expect(
      buildBookReference({
        title: "Caderno",
        author: "Autora",
        pages: 0,
      }),
    ).toBe("Caderno — Autora");
  });
});

describe("splitReaderLabels", () => {
  it("separa a lista formatada em nomes", () => {
    expect(splitReaderLabels("Ana, Bruno e Carla")).toEqual([
      "Ana",
      "Bruno",
      "Carla",
    ]);
    expect(splitReaderLabels("Matheus")).toEqual(["Matheus"]);
    expect(splitReaderLabels("Ana e Bruno")).toEqual(["Ana", "Bruno"]);
  });
});

describe("buildBookTimeline", () => {
  it("nomeia a data final como conclusão quando a leitura terminou", () => {
    expect(
      buildBookTimeline({
        status: "finished",
        planned_start_date: "2026-09-01",
        start_date: "2026-09-02",
        end_date: "2026-09-20",
      }).map((item) => item.label),
    ).toEqual(["Início planejado", "Leitura iniciada", "Concluído em"]);
  });
});
