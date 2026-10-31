import { describe, expect, it } from "vitest";

import { FINISHED_BOOK_SHARE_COPY } from "./finishedBookShareCopy";

const PHRASES = {
  dialogTitle: "Compartilhar no X",
  generating: "Gerando o cartão…",
  manualAttach:
    "A imagem fica no seu dispositivo. Este link não envia o arquivo — anexe o PNG na publicação.",
  download: "Baixar imagem",
  copyText: "Copiar texto",
  openOnX: "Abrir no X",
  close: "Fechar",
  retry: "Tentar de novo",
  generateError: "Não foi possível gerar a imagem. Tente de novo.",
  copyFailed: "Não foi possível copiar o texto.",
  popupBlocked: "Não foi possível abrir o X. Permita pop-ups e tente de novo.",
  hint: "Cartão da leitura",
} as const;

describe("finishedBookShareCopy", () => {
  it("trava o título", () => {
    expect(FINISHED_BOOK_SHARE_COPY.dialogTitle).toBe(PHRASES.dialogTitle);
  });

  it("trava o texto de geração", () => {
    expect(FINISHED_BOOK_SHARE_COPY.generating).toBe(PHRASES.generating);
  });

  it("trava a descrição do anexo manual", () => {
    expect(FINISHED_BOOK_SHARE_COPY.manualAttach).toBe(PHRASES.manualAttach);
  });

  it("trava o botão de baixar", () => {
    expect(FINISHED_BOOK_SHARE_COPY.download).toBe(PHRASES.download);
  });

  it("trava o botão de copiar", () => {
    expect(FINISHED_BOOK_SHARE_COPY.copyText).toBe(PHRASES.copyText);
  });

  it("trava o botão de abrir no X", () => {
    expect(FINISHED_BOOK_SHARE_COPY.openOnX).toBe(PHRASES.openOnX);
  });

  it("trava o botão de fechar", () => {
    expect(FINISHED_BOOK_SHARE_COPY.close).toBe(PHRASES.close);
  });

  it("trava o botão de tentar de novo", () => {
    expect(FINISHED_BOOK_SHARE_COPY.retry).toBe(PHRASES.retry);
  });

  it("trava o erro de geração", () => {
    expect(FINISHED_BOOK_SHARE_COPY.generateError).toBe(PHRASES.generateError);
  });

  it("trava o toast de cópia", () => {
    expect(FINISHED_BOOK_SHARE_COPY.copyFailed).toBe(PHRASES.copyFailed);
  });

  it("trava o toast de pop-up", () => {
    expect(FINISHED_BOOK_SHARE_COPY.popupBlocked).toBe(PHRASES.popupBlocked);
  });

  it("trava o hint do cartão", () => {
    expect(FINISHED_BOOK_SHARE_COPY.hint).toBe(PHRASES.hint);
  });

  it("não acrescenta outra frase nem rótulo em inglês", () => {
    expect(FINISHED_BOOK_SHARE_COPY).toEqual(PHRASES);
    expect(Object.keys(FINISHED_BOOK_SHARE_COPY)).toEqual(Object.keys(PHRASES));
    expect(Object.values(FINISHED_BOOK_SHARE_COPY).join("\n")).not.toMatch(
      /\b(Share|Download|Copy|Retry|Close|Open|Error|Loading|Card)\b/,
    );
  });
});
