import { describe, expect, it } from "vitest";

import type { FinishedBookShareSubject } from "../../types";
import {
  buildFinishedBookShareSubject,
  buildShareModel,
  buildTweetIntentUrl,
} from "./buildShareModel";

function subject(
  overrides: Partial<FinishedBookShareSubject> = {},
): FinishedBookShareSubject {
  return {
    bookId: "book-1",
    title: "Jogos Vorazes (Jogos Vorazes, #1)",
    author: "Suzanne Collins",
    imageUrl: "https://m.media-amazon.com/images/I/81abc.jpg",
    ...overrides,
  };
}

describe("buildFinishedBookShareSubject", () => {
  it("normaliza título, autor desconhecido e placeholder sem formatList", () => {
    const normalized = buildFinishedBookShareSubject(
      subject({
        title: "  Jogos Vorazes  ",
        author: "  Autor desconhecido  ",
        imageUrl: "  /book-cover-placeholder.svg  ",
      }),
    );

    expect(normalized.title).toBe("Jogos Vorazes");
    expect(normalized.author).toBeNull();
    expect(normalized.imageUrl).toBeNull();
    expect(buildFinishedBookShareSubject(subject({ author: "A, B e C" })).author).toBe(
      "A, B e C",
    );
    expect(buildFinishedBookShareSubject(subject({ imageUrl: "   " })).imageUrl).toBeNull();
  });
});

describe("buildShareModel", () => {
  it("monta a frase com Suzanne Collins e aspas curvas", () => {
    const model = buildShareModel(subject());

    expect(model.text).toBe(
      "Terminei de ler “Jogos Vorazes (Jogos Vorazes, #1)”, de Suzanne Collins.",
    );
    expect(model.text).not.toMatch(/https?:\/\//);
    expect(model.text).not.toMatch(/#\w{3,}/);
    expect(model.cardTitle).toBe("Jogos Vorazes (Jogos Vorazes, #1)");
    expect(model.alt).toBe(
      "Cartão de leitura de “Jogos Vorazes (Jogos Vorazes, #1)”, de Suzanne Collins. Leitura em 100%.",
    );
  });

  it("omite o autor quando ele não existe", () => {
    const model = buildShareModel(subject({ author: null }));

    expect(model.text).toBe("Terminei de ler “Jogos Vorazes (Jogos Vorazes, #1)”.");
    expect(model.alt).toBe(
      "Cartão de leitura de “Jogos Vorazes (Jogos Vorazes, #1)”. Leitura em 100%.",
    );
    expect(model.author).toBeNull();
  });

  it("omite Autor desconhecido", () => {
    const model = buildShareModel(subject({ author: "Autor desconhecido" }));

    expect(model.author).toBeNull();
    expect(model.text).not.toContain("Autor desconhecido");
    expect(model.text).not.toContain(", de ");
  });

  it("usa Livro sem título no cartão, no alt e no texto", () => {
    const model = buildShareModel(subject({ title: "   ", author: null }));

    expect(model.cardTitle).toBe("Livro sem título");
    expect(model.text).toBe("Terminei de ler “Livro sem título”.");
    expect(model.alt).toContain("Livro sem título");
    expect(model.filename).toBe("leitura.png");
  });

  it("encolhe o título dentro das aspas e preserva o cartão", () => {
    const title = "A".repeat(400);
    const model = buildShareModel(subject({ title, author: "Suzanne Collins" }));

    expect(Array.from(model.text).length).toBeLessThanOrEqual(250);
    expect(model.text).toContain("”, de Suzanne Collins.");
    expect(model.text).toContain("…");
    expect(model.cardTitle).toBe(title);
    expect(model.text).not.toContain(title);
  });

  it("encolhe o autor quando ele sozinho estoura 250", () => {
    const author = "B".repeat(300);
    const model = buildShareModel(subject({ title: "T", author }));

    expect(Array.from(model.text).length).toBeLessThanOrEqual(250);
    expect(model.text.startsWith("Terminei de ler “")).toBe(true);
    expect(model.text.endsWith(".")).toBe(true);
    expect(model.text).toContain("…");
    expect(model.cardTitle).toBe("T");
    expect(model.author).toBe(author);
  });

  it("monta o arquivo a partir do título inteiro, inclusive a série", () => {
    const model = buildShareModel(subject());

    expect(model.filename).toBe("jogos-vorazes-jogos-vorazes-1.png");
    expect(
      buildShareModel(subject({ title: "Memórias Póstumas", author: null })).filename,
    ).toBe("memorias-postumas.png");
  });

  it("usa leitura.png quando o slug fica vazio", () => {
    expect(buildShareModel(subject({ title: "???", author: null })).filename).toBe(
      "leitura.png",
    );
  });
});

describe("buildTweetIntentUrl", () => {
  it("codifica só o text no intent do twitter.com", () => {
    const model = buildShareModel(subject());
    const url = buildTweetIntentUrl(model.text);

    expect(url).toBe(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(model.text)}`,
    );
    expect(model.intentUrl).toBe(url);
    expect(url.includes("x.com")).toBe(false);

    const params = new URL(url).searchParams;
    expect([...params.keys()]).toEqual(["text"]);
    expect(params.get("text")).toBe(model.text);
    expect(params.has("url")).toBe(false);
    expect(params.has("media")).toBe(false);
    expect(params.has("via")).toBe(false);
  });
});
