import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BOOK_COVER_PLACEHOLDER_SRC } from "@/constants/bookCover";

import type { RecapImage, RecapImageCover, ReadingRecapPreviewProps } from "../../types";
import ReadingRecapPreview from "./readingRecapPreview";

const PREVIEW_FRAME_WIDTH_CLASS = "w-[min(100%,360px)]";
const AMAZON_A = "https://m.media-amazon.com/images/I/81abc.jpg";
const AMAZON_B = "https://m.media-amazon.com/images/I/81def.jpg";

function recapImageFromCovers(
  covers: RecapImageCover[],
  title = "Leituras de 7 de outubro de 2026",
): RecapImage {
  return {
    title,
    subtitle: null,
    covers,
    coverSrcs: covers.map((cover) => cover.src),
  };
}

const filledImage = recapImageFromCovers([
  { bookId: "book-a", title: "Duna", src: AMAZON_A },
  { bookId: "book-b", title: "Neuromancer", src: AMAZON_B },
]);

const defaultPreviewProps: ReadingRecapPreviewProps = {
  image: filledImage,
  periodTitle: "Leituras de 7 de outubro de 2026",
  isEmpty: false,
  isLoading: false,
  isError: false,
};

function expectNoPreviewNavigation() {
  expect(
    screen.queryByRole("button", { name: /anterior/i }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /próxima/i }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  expect(screen.queryByRole("group")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /ir para imagem/i }),
  ).not.toBeInTheDocument();
}

describe("ReadingRecapPreview", () => {
  it("escala capas na proporção BookCard 90×130 sem tamanho fixo", () => {
    const { container } = render(
      <ReadingRecapPreview
        image={filledImage}
        periodTitle="Leituras de 7 de outubro de 2026"
        isEmpty={false}
        isLoading={false}
        isError={false}
      />,
    );

    const covers = container.querySelectorAll("img");
    expect(covers).toHaveLength(2);
    for (const cover of covers) {
      expect(cover.className).toContain("aspect-[90/130]");
      expect(cover.className).not.toContain("h-[130px]");
      expect(cover.className).not.toContain("w-[90px]");
    }
  });

  it("mantém as capas acima do círculo decorativo", () => {
    render(
      <ReadingRecapPreview
        image={filledImage}
        periodTitle="Leituras de 7 de outubro de 2026"
        isEmpty={false}
        isLoading={false}
        isError={false}
      />,
    );

    const frame = screen.getByLabelText("Leituras de 7 de outubro de 2026");
    const circles = [...frame.children].filter((child) =>
      child.className.includes("rounded-full"),
    );
    const content = [...frame.children].find((child) =>
      child.className.includes("flex"),
    );

    expect(circles.length).toBeGreaterThan(0);
    for (const circle of circles) {
      expect(circle.className).toContain("z-0");
    }
    expect(content?.className).toContain("z-10");
    expect(content?.className).toContain("min-h-0");
  });

  it("usa a URL original da Amazon no preview, não o proxy de capas", () => {
    const { container } = render(
      <ReadingRecapPreview
        image={filledImage}
        periodTitle="Leituras de 7 de outubro de 2026"
        isEmpty={false}
        isLoading={false}
        isError={false}
      />,
    );

    const covers = container.querySelectorAll("img");
    expect(covers).toHaveLength(2);
    expect(covers[0]).toHaveAttribute("src", AMAZON_A);
    expect(covers[1]).toHaveAttribute("src", AMAZON_B);
    for (const cover of covers) {
      expect(cover.getAttribute("src") ?? "").not.toContain("/api/book-covers");
    }
  });

  it("mostra placeholder cadastrado e troca só o src da capa que falha, sem reflow", () => {
    const onRemoveBook = vi.fn();
    const { container } = render(
      <ReadingRecapPreview
        image={recapImageFromCovers([
          { bookId: "book-a", title: "Duna", src: AMAZON_A },
          {
            bookId: "book-p",
            title: "Placeholder",
            src: BOOK_COVER_PLACEHOLDER_SRC,
          },
          { bookId: "book-l", title: "Local", src: "/x.svg" },
          { bookId: "book-b", title: "Neuromancer", src: AMAZON_B },
        ])}
        periodTitle="Leituras de 7 de outubro de 2026"
        isEmpty={false}
        isLoading={false}
        isError={false}
        onRemoveBook={onRemoveBook}
      />,
    );

    const covers = container.querySelectorAll("img");
    expect(covers).toHaveLength(4);
    expect(Array.from(covers).map((cover) => cover.getAttribute("src"))).toEqual([
      AMAZON_A,
      BOOK_COVER_PLACEHOLDER_SRC,
      "/x.svg",
      AMAZON_B,
    ]);

    fireEvent.error(covers[0]);
    expect(onRemoveBook).not.toHaveBeenCalled();

    const remaining = container.querySelectorAll("img");
    expect(remaining).toHaveLength(4);
    expect(Array.from(remaining).map((cover) => cover.getAttribute("src"))).toEqual([
      BOOK_COVER_PLACEHOLDER_SRC,
      BOOK_COVER_PLACEHOLDER_SRC,
      "/x.svg",
      AMAZON_B,
    ]);
  });

  it("mostra botão Remover por capa só quando onRemoveBook é passado", async () => {
    const user = userEvent.setup();
    const onRemoveBook = vi.fn();

    const { rerender } = render(
      <ReadingRecapPreview
        image={filledImage}
        periodTitle="Leituras de 7 de outubro de 2026"
        isEmpty={false}
        isLoading={false}
        isError={false}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Remover Duna do recap" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Remover .+ do recap/ }),
    ).not.toBeInTheDocument();

    rerender(
      <ReadingRecapPreview
        image={filledImage}
        periodTitle="Leituras de 7 de outubro de 2026"
        isEmpty={false}
        isLoading={false}
        isError={false}
        onRemoveBook={onRemoveBook}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Remover Duna do recap" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remover Neuromancer do recap" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Remover Duna do recap" }),
    );
    expect(onRemoveBook).toHaveBeenCalledWith("book-a");
  });

  it("mostra a copy de vazio quando não há leituras no período", () => {
    render(
      <ReadingRecapPreview
        {...defaultPreviewProps}
        image={null}
        isEmpty
      />,
    );

    expect(
      screen.getByText(
        "Nenhuma leitura finalizada neste período. Troque o ano, o mês ou o dia.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Nenhuma leitura com capa cadastrada neste período. Troque o ano, o mês ou o dia.",
      ),
    ).not.toBeInTheDocument();
  });

  it("usa emptyCaption quando o recap ficou vazio por exclusão manual", () => {
    render(
      <ReadingRecapPreview
        {...defaultPreviewProps}
        image={null}
        isEmpty
        emptyCaption="Você removeu todas as capas. Feche e abra de novo para restaurá-las."
      />,
    );

    expect(
      screen.getByText(
        "Você removeu todas as capas. Feche e abra de novo para restaurá-las.",
      ),
    ).toBeInTheDocument();
  });

  it("usa grade de 4 fileiras e não a grade antiga de 5", () => {
    const { container } = render(
      <ReadingRecapPreview
        image={filledImage}
        periodTitle="Leituras de 7 de outubro de 2026"
        isEmpty={false}
        isLoading={false}
        isError={false}
      />,
    );

    const grid = container.querySelector(".grid-rows-4");
    expect(grid?.className).toContain("grid-rows-4");
    expect(grid?.className).not.toContain("grid-rows-5");
  });

  it("usa frame maior que 220px com teto de 360px", () => {
    render(
      <ReadingRecapPreview
        image={filledImage}
        periodTitle="Leituras de 7 de outubro de 2026"
        isEmpty={false}
        isLoading={false}
        isError={false}
      />,
    );

    const frame = screen.getByLabelText("Leituras de 7 de outubro de 2026")
      .parentElement;
    expect(frame?.className).toContain(PREVIEW_FRAME_WIDTH_CLASS);
    expect(frame?.className).not.toContain("220px");
  });

  it("usa a mesma largura maior no skeleton de carregamento", () => {
    render(
      <ReadingRecapPreview
        image={null}
        periodTitle="Leituras de 7 de outubro de 2026"
        isEmpty={false}
        isLoading
        isError={false}
      />,
    );

    const skeleton = screen.getByLabelText("Carregando imagens das leituras");
    expect(skeleton.className).toContain(PREVIEW_FRAME_WIDTH_CLASS);
    expect(skeleton.className).not.toContain("220px");
  });

  it("usa a mesma largura maior no estado de erro", () => {
    render(
      <ReadingRecapPreview
        image={null}
        periodTitle="Leituras de 7 de outubro de 2026"
        isEmpty={false}
        isLoading={false}
        isError
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert.className).toContain(PREVIEW_FRAME_WIDTH_CLASS);
    expect(alert.className).not.toContain("220px");
  });

  it("não mostra setas nem dots com uma imagem", () => {
    render(
      <ReadingRecapPreview
        {...defaultPreviewProps}
        imageCount={1}
        imageIndex={0}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        onSelectImage={vi.fn()}
      />,
    );

    expectNoPreviewNavigation();
  });

  it("mostra setas e dois dots e dispara os callbacks de navegação", async () => {
    const user = userEvent.setup();
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onSelectImage = vi.fn();
    const twoImageProps: ReadingRecapPreviewProps = {
      ...defaultPreviewProps,
      imageCount: 2,
      imageIndex: 0,
      onPrevious,
      onNext,
      onSelectImage,
    };

    const { rerender } = render(<ReadingRecapPreview {...twoImageProps} />);

    expect(
      screen.getAllByRole("tab", { name: /ir para imagem/i }),
    ).toHaveLength(2);
    expect(screen.getByRole("button", { name: /anterior/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /próxima/i })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: /próxima/i }));
    expect(onNext).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("tab", { name: /ir para imagem 2/i }));
    expect(onSelectImage).toHaveBeenCalledWith(1);

    rerender(<ReadingRecapPreview {...twoImageProps} imageIndex={1} />);

    await user.click(screen.getByRole("button", { name: /anterior/i }));
    expect(onPrevious).toHaveBeenCalledOnce();
  });

  it("mostra três dots quando há três imagens", () => {
    render(
      <ReadingRecapPreview
        {...defaultPreviewProps}
        imageCount={3}
        imageIndex={0}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        onSelectImage={vi.fn()}
      />,
    );

    expect(
      screen.getAllByRole("tab", { name: /ir para imagem/i }),
    ).toHaveLength(3);
  });

  it("não mostra setas nem dots no carregamento", () => {
    render(
      <ReadingRecapPreview
        {...defaultPreviewProps}
        image={null}
        isLoading
        imageCount={2}
        imageIndex={0}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        onSelectImage={vi.fn()}
      />,
    );

    expectNoPreviewNavigation();
  });

  it("não mostra setas nem dots no erro", () => {
    render(
      <ReadingRecapPreview
        {...defaultPreviewProps}
        image={null}
        isError
        imageCount={2}
        imageIndex={0}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        onSelectImage={vi.fn()}
      />,
    );

    expectNoPreviewNavigation();
  });

  it("não mostra setas nem dots no vazio", () => {
    render(
      <ReadingRecapPreview
        {...defaultPreviewProps}
        image={null}
        isEmpty
        imageCount={0}
        imageIndex={0}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        onSelectImage={vi.fn()}
      />,
    );

    expectNoPreviewNavigation();
  });
});
