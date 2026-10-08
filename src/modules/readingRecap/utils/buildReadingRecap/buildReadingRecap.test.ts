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
const GOOGLE_COVER = "https://books.google.com/books/content?id=abc";
const OPEN_LIBRARY_COVER = "https://covers.openlibrary.org/b/id/12345-L.jpg";
const SSL_AMAZON_COVER =
  "https://images-na.ssl-images-amazon.com/images/I/81abc.jpg";
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
    });

    expect(aguaFirst[0].coverSrcs).toEqual([
      "https://m.media-amazon.com/images/I/agua.jpg",
      "https://m.media-amazon.com/images/I/zebra.jpg",
    ]);
  });

  it("parte em imagens de 12 capas e numera o título só quando há mais de uma", () => {
    const twelve = Array.from({ length: 12 }, (_, index) =>
      book(`Livro ${String(index + 1).padStart(2, "0")}`, "2026-10-07"),
    );
    const thirteen = [...twelve, book("Livro 13", "2026-10-07")];

    const single = recap(twelve, day);
    expect(single).toHaveLength(1);
    expect(single[0].title).toBe("Leituras de 7 de outubro de 2026");
    expect(single[0].coverSrcs).toHaveLength(12);

    const two = recap(thirteen, day);
    expect(two).toHaveLength(2);
    expect(two[0].title).toBe("Leituras de 7 de outubro de 2026 · 1/2");
    expect(two[0].coverSrcs).toHaveLength(12);
    expect(two[1].title).toBe("Leituras de 7 de outubro de 2026 · 2/2");
    expect(two[1].coverSrcs).toHaveLength(1);
  });

  it("não preenche a última imagem com placeholder nos slots vazios", () => {
    const books = Array.from({ length: 16 }, (_, index) =>
      book(`Livro ${index + 1}`, "2026-06-01"),
    );

    const images = recap(books, year);
    expect(images).toHaveLength(2);
    expect(images[0].coverSrcs).toHaveLength(12);
    expect(images[1].coverSrcs).toEqual([COVER, COVER, COVER, COVER]);
    expect(images[1].coverSrcs).not.toContain(PLACEHOLDER);
  });

  it("exclui livro com capa vazia, em branco ou de host não permitido", () => {
    const images = recap(
      [
        book("Sem capa", "2026-10-07", { imageUrl: null }),
        book("Host inválido", "2026-10-07", { imageUrl: INVALID_COVER }),
        book("Espaços", "2026-10-07", { imageUrl: "   " }),
        book("Vazia", "2026-10-07", { imageUrl: "" }),
      ],
      day,
    );

    expect(images).toEqual([]);
  });

  it("inclui path local permitido e ainda exclui placeholder", () => {
    const images = recap(
      [
        book("Path local", "2026-10-07", { imageUrl: "/x.svg" }),
        book("Placeholder com query", "2026-10-07", {
          imageUrl: `${PLACEHOLDER}?v=1`,
        }),
      ],
      day,
    );

    expect(images).toHaveLength(1);
    expect(images[0].coverSrcs).toEqual(["/x.svg"]);
    expect(images[0].coverSrcs).not.toContain(PLACEHOLDER);
  });

  it("exclui livro com capa igual ao placeholder do cadastro", () => {
    const images = recap(
      [
        book("Placeholder", "2026-10-07", { imageUrl: PLACEHOLDER }),
        book("Placeholder com espaços", "2026-10-07", {
          imageUrl: `  ${PLACEHOLDER}  `,
        }),
      ],
      day,
    );

    expect(images).toEqual([]);
  });

  it("devolve lista vazia quando o período só tem livros sem capa cadastrada", () => {
    const images = recap(
      [
        book("Sem capa", "2026-10-07", { imageUrl: null }),
        book("Placeholder", "2026-10-07", { imageUrl: PLACEHOLDER }),
        book("Host inválido", "2026-10-07", { imageUrl: INVALID_COVER }),
        book("Espaços", "2026-10-07", { imageUrl: "   " }),
      ],
      day,
    );

    expect(images).toEqual([]);
  });

  it("na lista mista inclui só capas cadastradas e preserva a ordem", () => {
    const novo = "https://m.media-amazon.com/images/I/novo.jpg";
    const antigo = "https://m.media-amazon.com/images/I/antigo.jpg";
    const agua = "https://m.media-amazon.com/images/I/agua.jpg";
    const zebra = "https://m.media-amazon.com/images/I/zebra.jpg";

    const images = recap(
      [
        book("Novo sem capa", "2026-10-20", { imageUrl: null }),
        book("Novo com capa", "2026-10-20", { imageUrl: novo }),
        book("Zebra", "2026-10-07", { imageUrl: zebra }),
        book("Água", "2026-10-07", { imageUrl: agua }),
        book("Antigo com capa", "2026-10-01", { imageUrl: antigo }),
        book("Antigo placeholder", "2026-10-01", { imageUrl: PLACEHOLDER }),
        book("Host inválido", "2026-10-07", { imageUrl: INVALID_COVER }),
      ],
      year,
    );

    expect(images).toHaveLength(1);
    expect(images[0].coverSrcs).toEqual([novo, agua, zebra, antigo]);
    expect(images[0].coverSrcs).not.toContain(PLACEHOLDER);
  });

  it("na lista mista pagina só capas cadastradas e não preenche slots vazios", () => {
    const covered = Array.from({ length: 16 }, (_, index) =>
      book(`Capa ${String(index + 1).padStart(2, "0")}`, "2026-10-07", {
        imageUrl: `https://m.media-amazon.com/images/I/${index + 1}.jpg`,
      }),
    );
    const withoutCover = [
      book("Sem capa 1", "2026-10-07", { imageUrl: null }),
      book("Sem capa 2", "2026-10-07", { imageUrl: PLACEHOLDER }),
      book("Sem capa 3", "2026-10-07", { imageUrl: INVALID_COVER }),
    ];

    const images = recap([...covered, ...withoutCover], day);

    expect(images).toHaveLength(2);
    expect(images[0].title).toBe("Leituras de 7 de outubro de 2026 · 1/2");
    expect(images[0].coverSrcs).toHaveLength(12);
    expect(images[0].coverSrcs).toEqual(
      Array.from(
        { length: 12 },
        (_, index) => `https://m.media-amazon.com/images/I/${index + 1}.jpg`,
      ),
    );
    expect(images[1].title).toBe("Leituras de 7 de outubro de 2026 · 2/2");
    expect(images[1].coverSrcs).toHaveLength(4);
    expect(images[1].coverSrcs).toEqual([
      "https://m.media-amazon.com/images/I/13.jpg",
      "https://m.media-amazon.com/images/I/14.jpg",
      "https://m.media-amazon.com/images/I/15.jpg",
      "https://m.media-amazon.com/images/I/16.jpg",
    ]);
    expect(images.flatMap((image) => image.coverSrcs)).not.toContain(
      PLACEHOLDER,
    );
  });

  it("preserva URL de capa de host permitido", () => {
    const images = recap(
      [
        book("Amazon", "2026-10-07", { imageUrl: COVER }),
        book("Amazon SSL", "2026-10-07", { imageUrl: SSL_AMAZON_COVER }),
        book("Google", "2026-10-07", { imageUrl: GOOGLE_COVER }),
        book("Open Library", "2026-10-07", { imageUrl: OPEN_LIBRARY_COVER }),
      ],
      day,
    );

    expect(images[0].coverSrcs).toEqual([
      COVER,
      SSL_AMAZON_COVER,
      GOOGLE_COVER,
      OPEN_LIBRARY_COVER,
    ]);
  });
});

describe("createDefaultRecapFilter", () => {
  it("abre no ano civil informado, sem gêneros", () => {
    expect(createDefaultRecapFilter(new Date(2026, 9, 7, 12, 0, 0, 0))).toEqual({
      period: { kind: "year", year: 2026, month: 10, day: 7 },
      genders: [],
    });
  });
});

describe("applyRecapPeriodKind", () => {
  it("preserva a âncora ao trocar ano → mês → dia", () => {
    const opened = createDefaultRecapFilter(new Date(2026, 9, 7, 12, 0, 0, 0));
    const asMonth = applyRecapPeriodKind(opened, "month");
    const asDay = applyRecapPeriodKind(asMonth, "day");

    expect(asMonth.period).toEqual({
      kind: "month",
      year: 2026,
      month: 10,
      day: 7,
    });
    expect(asDay.period).toEqual({
      kind: "day",
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
