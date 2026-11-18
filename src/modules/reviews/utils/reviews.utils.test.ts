import { describe, expect, it } from "vitest";

import { buildReviewTweetText, xWeightedLength } from "./buildReviewTweetText";
import { parseReviewTab, scopeFromTab } from "./parseReviewTab";
import { currentBookStatus, reviewStarsAvailable } from "./currentBookStatus";
import { filterReviewBooks } from "./filterReviewBooks";
import { canSubmitReview, reviewContentState } from "./reviewContent";
import { toggleReviewReaction } from "./reviewReaction";
import { reviewStatusLabel } from "./reviewStatusLabel";

describe("resenhas", () => {
  it("mapeia a aba da URL para o recorte do feed", () => {
    expect(parseReviewTab(null)).toBe("geral");
    expect(parseReviewTab("seguindo")).toBe("seguindo");
    expect(parseReviewTab("minhas")).toBe("minhas");
    expect(parseReviewTab("outra")).toBe("geral");
    expect(scopeFromTab("seguindo")).toBe("following");
    expect(scopeFromTab("minhas")).toBe("mine");
    expect(scopeFromTab("geral")).toBe("all");
  });

  it("mostra o status gravado na resenha", () => {
    expect(reviewStatusLabel("finished").label).toBe("Concluiu a leitura");
    expect(reviewStatusLabel("reading").label).toBe("Leu parcialmente (lendo)");
    expect(reviewStatusLabel("paused").label).toBe("Pausou a leitura");
    expect(reviewStatusLabel("abandoned").label).toBe("Abandonou a obra");
    expect(reviewStatusLabel("planned").label).toBe("Ainda não começou");
    expect(reviewStatusLabel("desconhecido").label).toBe("Ainda não começou");
  });

  it("conta os caracteres e só publica com estrelas e texto", () => {
    expect(reviewContentState("abc").counter).toBe("3/500");
    expect(reviewContentState("a".repeat(450)).tone).toBe("warn");
    expect(reviewContentState("a".repeat(500)).tone).toBe("limit");

    expect(
      canSubmitReview({
        mode: "finish",
        stars: 4,
        content: "   ",
        bookStatus: "finished",
      }).savesRatingOnly,
    ).toBe(true);
    expect(
      canSubmitReview({
        mode: "compose",
        stars: 4,
        content: "  Um livro  ",
        bookStatus: "finished",
      }).publishesReview,
    ).toBe(true);
    expect(
      canSubmitReview({
        mode: "compose",
        stars: 4,
        content: "Um livro",
        bookStatus: "reading",
      }),
    ).toMatchObject({ publishesReview: false, starsAvailable: false, ok: false });
    expect(reviewStarsAvailable("finished")).toBe(true);
    expect(reviewStarsAvailable("paused")).toBe(false);
    expect(currentBookStatus("finished").label).toBe("Leitura finalizada");
    expect(currentBookStatus("reading").label).toBe("Lendo agora");
    expect(currentBookStatus("abandoned").label).toBe("Livro abandonado");
    expect(
      filterReviewBooks(
        [
          {
            id: "1",
            title: "1984",
            author: "George Orwell",
            imageUrl: null,
            status: "reading",
            isSolo: false,
            hasReview: false,
          },
          {
            id: "2",
            title: "O Hobbit",
            author: "Tolkien",
            imageUrl: null,
            status: "finished",
            isSolo: false,
            hasReview: true,
          },
        ],
        "hobbit",
      ).map((book) => book.id),
    ).toEqual(["2"]);
    expect(
      canSubmitReview({
        mode: "compose",
        stars: null,
        content: "Texto",
        bookStatus: "reading",
      }).ok,
    ).toBe(false);
    expect(
      canSubmitReview({
        mode: "finish",
        stars: 5,
        content: "",
        bookStatus: "reading",
      }).ok,
    ).toBe(false);
  });

  it("alterna curtida e não curtida sem contagem negativa", () => {
    expect(
      toggleReviewReaction(
        { userReaction: null, likeCount: 1, dislikeCount: 0 },
        "like",
      ),
    ).toEqual({ userReaction: "like", likeCount: 2, dislikeCount: 0 });

    expect(
      toggleReviewReaction(
        { userReaction: "like", likeCount: 2, dislikeCount: 0 },
        "like",
      ),
    ).toEqual({ userReaction: null, likeCount: 1, dislikeCount: 0 });

    expect(
      toggleReviewReaction(
        { userReaction: "like", likeCount: 2, dislikeCount: 0 },
        "dislike",
      ),
    ).toEqual({ userReaction: "dislike", likeCount: 1, dislikeCount: 1 });

    expect(
      toggleReviewReaction(
        { userReaction: "dislike", likeCount: 0, dislikeCount: 0 },
        "dislike",
      ).dislikeCount,
    ).toBe(0);
  });

  it("corta o texto do X em 280 e não inclui link", () => {
    const short = buildReviewTweetText({
      title: "O Hobbit",
      author: "Tolkien",
      content: "Uma viagem redonda.",
      readerName: "Ana",
    });
    expect(short).toBe("Resenha de “O Hobbit”, de Tolkien: Uma viagem redonda. — Ana");
    expect(short).not.toContain("http");

    const long = buildReviewTweetText({
      title: "O Hobbit",
      author: "Tolkien",
      content: "a".repeat(400),
      readerName: "Ana",
    });
    expect(xWeightedLength(long)).toBeLessThanOrEqual(280);
    expect(long.endsWith("— Ana")).toBe(true);
    expect(long).toContain("…");
  });
});
