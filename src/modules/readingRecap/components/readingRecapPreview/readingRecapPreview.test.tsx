import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BOOK_COVER_PLACEHOLDER_SRC } from "@/constants/bookCover";

import type { ReadingRecapPreviewProps } from "../../types";
import ReadingRecapPreview from "./readingRecapPreview";

const PREVIEW_FRAME_WIDTH_CLASS = "w-[min(100%,360px)]";

const filledImage = {
  title: "Leituras de 7 de outubro de 2026",
  subtitle: null,
  coverSrcs: [
    "https://m.media-amazon.com/images/I/81abc.jpg",
    "https://m.media-amazon.com/images/I/81def.jpg",
  ],
};

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
    expect(covers[0]).toHaveAttribute(
      "src",
      "https://m.media-amazon.com/images/I/81abc.jpg",
    );
    expect(covers[1]).toHaveAttribute(
      "src",
      "https://m.media-amazon.com/images/I/81def.jpg",
    );
    for (const cover of covers) {
      expect(cover.getAttribute("src") ?? "").not.toContain("/api/book-covers");
    }
  });

  it("não renderiza placeholder, mostra path local permitido e some com a capa que falha", () => {
    const onCoverError = vi.fn();
    const { container } = render(
      <ReadingRecapPreview
        image={{
          ...filledImage,
          coverSrcs: [
            "https://m.media-amazon.com/images/I/81abc.jpg",
            BOOK_COVER_PLACEHOLDER_SRC,
            "/x.svg",
            "https://m.media-amazon.com/images/I/81def.jpg",
          ],
        }}
        periodTitle="Leituras de 7 de outubro de 2026"
        isEmpty={false}
        isLoading={false}
        isError={false}
        onCoverError={onCoverError}
      />,
    );

    const covers = container.querySelectorAll("img");
    expect(covers).toHaveLength(3);
    expect(Array.from(covers).map((cover) => cover.getAttribute("src"))).toEqual([
      "https://m.media-amazon.com/images/I/81abc.jpg",
      "/x.svg",
      "https://m.media-amazon.com/images/I/81def.jpg",
    ]);
    expect(
      Array.from(covers).some((cover) =>
        (cover.getAttribute("src") ?? "").includes("book-cover-placeholder"),
      ),
    ).toBe(false);
    expect(
      Array.from(covers).some((cover) =>
        (cover.getAttribute("src") ?? "").includes("/api/book-covers"),
      ),
    ).toBe(false);

    fireEvent.error(covers[0]);
    expect(onCoverError).toHaveBeenCalledWith(
      "https://m.media-amazon.com/images/I/81abc.jpg",
    );

    const remaining = container.querySelectorAll("img");
    expect(remaining).toHaveLength(2);
    expect(Array.from(remaining).map((cover) => cover.getAttribute("src"))).toEqual(
      ["/x.svg", "https://m.media-amazon.com/images/I/81def.jpg"],
    );
    expect(
      Array.from(remaining).some((cover) =>
        (cover.getAttribute("src") ?? "").includes("book-cover-placeholder"),
      ),
    ).toBe(false);
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
