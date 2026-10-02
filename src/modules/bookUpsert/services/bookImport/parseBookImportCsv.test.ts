import { describe, expect, it } from "vitest";

import {
  BOOK_IMPORT_LIMIT,
  BOOK_IMPORT_STORYGRAPH_MESSAGE,
  BOOK_IMPORT_TOO_MANY_ROWS_MESSAGE,
  BOOK_IMPORT_UNRECOGNIZED_MESSAGE,
} from "./bookImport.messages";
import { parseBookImportCsv } from "./parseBookImportCsv";

describe("parseBookImportCsv", () => {
  it("ignora a linha de exemplo e aceita o modelo", () => {
    const parsed = parseBookImportCsv(
      [
        "titulo,autor,paginas,status,data_fim",
        "Exemplo: não importar,Nosso TBR,1,not_started,",
        "Duna,Frank Herbert,412,finished,2020-05-01",
        "O Hobbit,J.R.R. Tolkien,320.0,reading,",
      ].join("\n"),
    );

    expect(parsed).toEqual({
      kind: "rows",
      candidates: [
        {
          title: "Duna",
          authorName: "Frank Herbert",
          pages: 412,
          status: "finished",
          endDate: "2020-05-01",
        },
        {
          title: "O Hobbit",
          authorName: "J.R.R. Tolkien",
          pages: 320,
          status: "reading",
          endDate: null,
        },
      ],
      rejectedRows: [],
    });
  });

  it("aceita ponto e vírgula e recusa finished sem data", () => {
    const parsed = parseBookImportCsv(
      [
        "titulo;autor;paginas;status;data_fim",
        "Duna;Frank Herbert;412;finished;",
        "Neuromancer;William Gibson;271;not_started;",
      ].join("\n"),
    );

    expect(parsed.kind).toBe("rows");
    if (parsed.kind !== "rows") return;

    expect(parsed.candidates).toEqual([
      {
        title: "Neuromancer",
        authorName: "William Gibson",
        pages: 271,
        status: "not_started",
        endDate: null,
      },
    ]);
    expect(parsed.rejectedRows).toEqual([
      { title: "Duna", reason: "invalid" },
    ]);
  });

  it("trata a segunda ocorrência no arquivo como duplicata, sem diferenciar acento", () => {
    const parsed = parseBookImportCsv(
      [
        "titulo,autor,paginas,status,data_fim",
        "Duna,Frank Herbert,10,not_started,",
        "dúna,frank herbert,10,reading,",
      ].join("\n"),
    );

    expect(parsed).toMatchObject({
      kind: "rows",
      rejectedRows: [{ title: "dúna", reason: "duplicate" }],
    });
  });

  it("mapeia o export do Goodreads e ignora colunas extras", () => {
    const parsed = parseBookImportCsv(
      [
        "Title,Author,Exclusive Shelf,Number of Pages,Date Read,My Review,ISBN",
        '"Duna, o deserto",Frank Herbert,read,412,2020/05/01,"resenha, longa",123',
        "Sol,Ursula K.,to-read,80,,,",
        "Parado,Alguém,did-not-finish,90,2020/01/01,,",
      ].join("\n"),
    );

    expect(parsed).toEqual({
      kind: "rows",
      candidates: [
        {
          title: "Duna, o deserto",
          authorName: "Frank Herbert",
          pages: 412,
          status: "finished",
          endDate: "2020-05-01",
        },
        {
          title: "Sol",
          authorName: "Ursula K.",
          pages: 80,
          status: "not_started",
          endDate: null,
        },
      ],
      rejectedRows: [{ title: "Parado", reason: "invalid" }],
    });
  });

  it("recusa o export nativo do StoryGraph", () => {
    const parsed = parseBookImportCsv(
      "Title,Authors,Read Status,Star Rating\nDuna,Frank Herbert,read,5\n",
    );

    expect(parsed).toEqual({
      kind: "refused",
      message: BOOK_IMPORT_STORYGRAPH_MESSAGE,
    });
  });

  it("recusa cabeçalho desconhecido", () => {
    expect(parseBookImportCsv("a,b,c\n1,2,3\n")).toEqual({
      kind: "refused",
      message: BOOK_IMPORT_UNRECOGNIZED_MESSAGE,
    });
  });

  it("recusa o arquivo inteiro acima de 5000 livros", () => {
    const rows = ["titulo,autor,paginas,status,data_fim"];
    for (let index = 0; index < BOOK_IMPORT_LIMIT + 1; index += 1) {
      rows.push(`Livro ${index},Autor,10,not_started,`);
    }

    expect(parseBookImportCsv(rows.join("\n"))).toEqual({
      kind: "refused",
      message: BOOK_IMPORT_TOO_MANY_ROWS_MESSAGE,
    });
  });
});
