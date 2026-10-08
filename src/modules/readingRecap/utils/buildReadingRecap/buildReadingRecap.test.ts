import { describe, expect, it } from "vitest";

import type { RecapBook, RecapFilter, RecapPeriod } from "../../types";
import {
  applyRecapAnchorDate,
  applyRecapPeriodKind,
  buildReadingRecap,
  createDefaultRecapFilter,
  toRecapDownloadFilename,
} from "./buildReadingRecap";

const PLACEHOLDER = "/book-cover-placeholder.svg";
const COVER = "https://m.media-amazon.com/images/I/81abc.jpg";
const INVALID_COVER = "https://example.com/cover.jpg";

function book(
  title: string,
  endDate: string,
  extra: Partial<RecapBook> = {},
): RecapBook {
  return {
    title,
    endDate,
    gender: null,
    imageUrl: COVER,
    ...extra,
  };
}

function filter(period: RecapPeriod, genders: string[] = []): RecapFilter {
  return { period, genders };
}

function recap(books: RecapBook[], period: RecapPeriod, genders: string[] = []) {
  return buildReadingRecap({
    books,
    filter: filter(period, genders),
    placeholderSrc: PLACEHOLDER,
  });
}

describe("buildReadingRecap", () => {
  const day = {
    kind: "day" as const,
    year: 2026,
    month: 10,
    day: 7,
  };
  const month = {
    kind: "month" as const,
    year: 2026,
    month: 3,
  };
  const year = { kind: "year" as const, year: 2026 };

  it("devolve lista vazia quando não há livros no período", () => {
    expect(
      recap([book("Duna", "2026-10-06")], day),
    ).toEqual([]);
  });

  it("devolve lista vazia quando a lista de livros está vazia", () => {
    expect(recap([], day)).toEqual([]);
  });

  it("inclui só o livro com end_date no dia civil escolhido", () => {
    const images = recap(
      [
        book("Hoje", "2026-10-07"),
        book("Ontem", "2026-10-06"),
        book("Amanhã", "2026-10-08"),
      ],
      day,
    );

    expect(images).toHaveLength(1);
    expect(images[0].title).toBe("Leituras de 7 de outubro de 2026");
    expect(images[0].subtitle).toBeNull();
    expect(images[0].coverSrcs).toEqual([COVER]);
  });

  it("coloca 31 de março no recap de março e 1º de abril no de abril", () => {
    const books = [
      book("Março", "2026-03-31"),
      book("Abril", "2026-04-01"),
    ];

    const march = recap(books, month);
    expect(march).toHaveLength(1);
    expect(march[0].title).toBe("Leituras de março de 2026");
    expect(march[0].coverSrcs).toHaveLength(1);

    const april = recap(books, {
      kind: "month",
      year: 2026,
      month: 4,
    });
    expect(april[0].coverSrcs).toHaveLength(1);
    expect(april[0].title).toBe("Leituras de abril de 2026");
  });

  it("no recap anual inclui só quem tem end_date no ano, mesmo se começou antes", () => {
    const images = recap(
      [
        book("Bruno 2026", "2026-01-02"),
        book("Começou em 2025", "2025-12-31"),
      ],
      year,
    );

    expect(images[0].title).toBe("Leituras do ano 2026");
    expect(images[0].coverSrcs).toHaveLength(1);
  });

  it("aceita end_date em ISO datetime vindo do mapper", () => {
    const images = recap(
      [book("Meio-dia", "2026-10-07T15:00:00.000Z")],
      day,
    );

    expect(images).toHaveLength(1);
  });

  it("ignora livro sem data civil válida", () => {
    expect(recap([book("Inválido", "não-é-data")], day)).toEqual([]);
  });

  it("sem gênero no filtro inclui livros com e sem gênero", () => {
    const images = recap(
      [
        book("Com gênero", "2026-10-07", { gender: "romance" }),
        book("Sem gênero", "2026-10-07", { gender: null }),
      ],
      day,
    );

    expect(images[0].coverSrcs).toHaveLength(2);
    expect(images[0].subtitle).toBeNull();
  });

  it("vários gêneros funcionam como OU e viram subtítulo em pt-BR", () => {
    const images = recap(
      [
        book("Romance", "2026-10-07", { gender: "romance" }),
        book("Fantasia", "2026-10-07", { gender: "fantasy" }),
        book("Terror", "2026-10-07", { gender: "horror" }),
        book("Sem gênero", "2026-10-07", { gender: null }),
      ],
      day,
      ["romance", "fantasy"],
    );

    expect(images[0].coverSrcs).toHaveLength(2);
    expect(images[0].subtitle).toBe("Romance · Fantasia");
  });

  it("ordena por end_date mais recente primeiro", () => {
    const images = recap(
      [
        book("Mais antigo", "2026-10-01", {
          imageUrl: "https://m.media-amazon.com/images/I/antigo.jpg",
        }),
        book("Mais novo", "2026-10-20", {
          imageUrl: "https://m.media-amazon.com/images/I/novo.jpg",
        }),
      ],
      year,
    );

    expect(images[0].coverSrcs).toEqual([
      "https://m.media-amazon.com/images/I/novo.jpg",
      "https://m.media-amazon.com/images/I/antigo.jpg",
    ]);
  });

  it("ordena empate do mesmo dia por título A–Z em pt-BR", () => {
    const images = recap(
      [book("Zebra", "2026-10-07"), book("Água", "2026-10-07")],
      day,
    );

    const aguaFirst = buildReadingRecap({
      books: [
        book("Zebra", "2026-10-07", { imageUrl: "https://m.media-amazon.com/images/I/zebra.jpg" }),
        book("Água", "2026-10-07", { imageUrl: "https://m.media-amazon.com/images/I/agua.jpg" }),
      ],
      filter: filter(day),
      placeholderSrc: PLACEHOLDER,
    });

    expect(aguaFirst[0].coverSrcs).toEqual([
      "https://m.media-amazon.com/images/I/agua.jpg",
      "https://m.media-amazon.com/images/I/zebra.jpg",
    ]);
  });

  it("parte em imagens de 15 capas e numera o título só quando há mais de uma", () => {
    const fifteen = Array.from({ length: 15 }, (_, index) =>
      book(`Livro ${String(index + 1).padStart(2, "0")}`, "2026-10-07"),
    );
    const sixteen = [
      ...fifteen,
      book("Livro 16", "2026-10-07"),
    ];

    const single = recap(fifteen, day);
    expect(single).toHaveLength(1);
    expect(single[0].title).toBe("Leituras de 7 de outubro de 2026");
    expect(single[0].coverSrcs).toHaveLength(15);

    const two = recap(sixteen, day);
    expect(two).toHaveLength(2);
    expect(two[0].title).toBe("Leituras de 7 de outubro de 2026 · 1/2");
    expect(two[0].coverSrcs).toHaveLength(15);
    expect(two[1].title).toBe("Leituras de 7 de outubro de 2026 · 2/2");
    expect(two[1].coverSrcs).toHaveLength(1);
  });

  it("não preenche a última imagem com placeholder nos slots vazios", () => {
    const books = Array.from({ length: 16 }, (_, index) =>
      book(`Livro ${index + 1}`, "2026-06-01"),
    );

    const images = recap(books, year);
    expect(images[1].coverSrcs).toEqual([COVER]);
    expect(images[1].coverSrcs).not.toContain(PLACEHOLDER);
  });

  it("usa placeholder quando a URL da capa é vazia ou de host não permitido", () => {
    const images = recap(
      [
        book("Sem capa", "2026-10-07", { imageUrl: null }),
        book("Host inválido", "2026-10-07", { imageUrl: INVALID_COVER }),
        book("Espaços", "2026-10-07", { imageUrl: "   " }),
      ],
      day,
    );

    expect(images[0].coverSrcs).toEqual([
      PLACEHOLDER,
      PLACEHOLDER,
      PLACEHOLDER,
    ]);
  });

  it("preserva URL de capa de host permitido", () => {
    const images = recap(
      [book("Amazon", "2026-10-07", { imageUrl: COVER })],
      day,
    );

    expect(images[0].coverSrcs).toEqual([COVER]);
  });
});

describe("createDefaultRecapFilter", () => {
  it("abre no dia civil informado, sem gêneros", () => {
    expect(createDefaultRecapFilter(new Date(2026, 9, 7, 12, 0, 0, 0))).toEqual({
      period: { kind: "day", year: 2026, month: 10, day: 7 },
      genders: [],
    });
  });
});

describe("applyRecapPeriodKind", () => {
  it("preserva a âncora ao trocar dia → mês → ano", () => {
    const opened = createDefaultRecapFilter(new Date(2026, 9, 7, 12, 0, 0, 0));
    const asMonth = applyRecapPeriodKind(opened, "month");
    const asYear = applyRecapPeriodKind(asMonth, "year");

    expect(asMonth.period).toEqual({
      kind: "month",
      year: 2026,
      month: 10,
      day: 7,
    });
    expect(asYear.period).toEqual({
      kind: "year",
      year: 2026,
      month: 10,
      day: 7,
    });
  });
});

describe("applyRecapAnchorDate", () => {
  it("atualiza ano, mês e dia sem mudar o tipo de período", () => {
    const current = filter({
      kind: "month",
      year: 2026,
      month: 10,
      day: 7,
    });

    expect(applyRecapAnchorDate(current, new Date(2025, 2, 31, 12))).toEqual({
      period: { kind: "month", year: 2025, month: 3, day: 31 },
      genders: [],
    });
  });
});

describe("toRecapDownloadFilename", () => {
  it("deriva o nome do arquivo do título da imagem, incluindo 1/2", () => {
    expect(
      toRecapDownloadFilename("Leituras de 7 de outubro de 2026 · 1/2"),
    ).toBe("leituras-de-7-de-outubro-de-2026-1-2.png");
  });
});
