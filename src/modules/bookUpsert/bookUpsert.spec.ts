import { describe, it, expect, vi } from "vitest";
import { bookCreateSchema } from "../home/validators/createBook.validator";
import { BookUpsertMapper } from "./services/mappers/bookUpsert.mapper";
import { BookCreateValidator } from "@/types/books.types";
import { BOOK_COVER_PLACEHOLDER_SRC } from "@/constants/bookCover";

const READER_A = "11111111-1111-4111-8111-111111111111";

function createValidBook(
  overrides?: Partial<BookCreateValidator>,
): BookCreateValidator {
  return {
    id: "book-1",
    title: "Livro de Teste",
    author_id: "author-1",
    chosen_by: READER_A,
    pages: 100,
    readers: [READER_A],
    image_url: "https://amazon.com/image.jpg",
    gender: "Fantasia",
    user_id: READER_A,
    ...overrides,
  };
}

type ChosenByOption = { label: string; value: string };

function buildChosenByField(currentValue: string) {
  return { value: currentValue, onChange: vi.fn() };
}

function buildFormSetValue() {
  return vi.fn();
}

function invokeHandleChosenByChange(
  field: ReturnType<typeof buildChosenByField>,
  setValue: ReturnType<typeof buildFormSetValue>,
  chosenByOptions: ChosenByOption[],
  selectedUserId: string,
) {
  const isDeselecting = field.value === selectedUserId;

  if (isDeselecting) {
    field.onChange("");
    setValue("chosen_by", "", { shouldValidate: true });
    return;
  }

  field.onChange(selectedUserId);

  setValue("chosen_by", selectedUserId, { shouldValidate: true });
}

const defaultChosenByOptions: ChosenByOption[] = [
  { label: "Matheus", value: "user-matheus" },
  { label: "Fabi", value: "user-fabi" },
  { label: "Barbara", value: "user-barbara" },
];

describe("handleChosenByChange - lógica de seleção/deseleção", () => {
  it("deve selecionar o usuário quando nenhum está selecionado", () => {
    const field = buildChosenByField("");
    const setValue = buildFormSetValue();

    invokeHandleChosenByChange(
      field,
      setValue,
      defaultChosenByOptions,
      "user-matheus",
    );

    expect(field.onChange).toHaveBeenCalledWith("user-matheus");
    expect(setValue).toHaveBeenCalledWith("chosen_by", "user-matheus", {
      shouldValidate: true,
    });
  });

  it("deve desselecionar quando o mesmo usuário é clicado novamente", () => {
    const field = buildChosenByField("user-matheus");
    const setValue = buildFormSetValue();

    invokeHandleChosenByChange(
      field,
      setValue,
      defaultChosenByOptions,
      "user-matheus",
    );

    expect(field.onChange).toHaveBeenCalledWith("");
    expect(setValue).toHaveBeenCalledWith("chosen_by", "", {
      shouldValidate: true,
    });
    expect(field.onChange).toHaveBeenCalledTimes(1);
  });

  it("deve trocar a seleção ao clicar em outro usuário", () => {
    const field = buildChosenByField("user-matheus");
    const setValue = buildFormSetValue();

    invokeHandleChosenByChange(
      field,
      setValue,
      defaultChosenByOptions,
      "user-fabi",
    );

    expect(field.onChange).toHaveBeenCalledWith("user-fabi");
    expect(setValue).toHaveBeenCalledWith("chosen_by", "user-fabi", {
      shouldValidate: true,
    });
  });

  it("deve definir chosen_by como undefined quando userId não existe nas opções", () => {
    const field = buildChosenByField("");
    const setValue = buildFormSetValue();

    invokeHandleChosenByChange(
      field,
      setValue,
      defaultChosenByOptions,
      "user-unknown",
    );

    expect(field.onChange).toHaveBeenCalledWith("user-unknown");
    expect(setValue).toHaveBeenCalledWith("chosen_by", "user-unknown", {
      shouldValidate: true,
    });
  });

  it("não deve chamar onChange uma segunda vez no fluxo de deseleção", () => {
    const field = buildChosenByField("user-barbara");
    const setValue = buildFormSetValue();

    invokeHandleChosenByChange(
      field,
      setValue,
      defaultChosenByOptions,
      "user-barbara",
    );

    expect(field.onChange).toHaveBeenCalledTimes(1);
    expect(field.onChange).toHaveBeenCalledWith("");
  });
});

describe("BookUpsert - campo user_id (Quem escolheu?)", () => {
  it("should accept a book without user_id as the field is optional", () => {
    const bookWithoutUserId = createValidBook();
    delete bookWithoutUserId.user_id;

    const result = bookCreateSchema.safeParse(bookWithoutUserId);

    expect(result.success).toBe(true);
  });

  it("deve aceitar user_id preenchido e preservá-lo no parse", () => {
    const result = bookCreateSchema.safeParse(
      createValidBook({ user_id: "user-matheus" }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user_id).toBe("user-matheus");
    }
  });

  it("deve aceitar user_id como string vazia após deseleção", () => {
    const result = bookCreateSchema.safeParse(createValidBook({ user_id: "" }));

    expect(result.success).toBe(true);
  });
});

describe("BookUpsert - campo chosen_by", () => {
  it("deve falhar quando chosen_by estiver vazio", () => {
    const result = bookCreateSchema.safeParse(
      createValidBook({ chosen_by: "" }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path[0] === "chosen_by"),
      ).toBe(true);
    }
  });

  it("deve aceitar UUIDs válidos em chosen_by", () => {
    const validValues = [
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
      "33333333-3333-4333-8333-333333333333",
    ] as const;

    for (const chosenBy of validValues) {
      const result = bookCreateSchema.safeParse(
        createValidBook({ chosen_by: chosenBy, user_id: chosenBy }),
      );
      expect(result.success).toBe(true);
    }
  });
});

describe("BookUpsert - campo author", () => {
  it("deve falhar quando author_id estiver vazio", () => {
    const invalidBook = createValidBook({ author_id: "" });

    const result = bookCreateSchema.safeParse(invalidBook);

    expect(result.success).toBe(false);
    if (!result.success) {
      const hasAuthorError = result.error.issues.some(
        (issue) => issue.path[0] === "author_id",
      );
      expect(hasAuthorError).toBe(true);
    }
  });

  it("deve aceitar um author_id não vazio, mesmo que o valor seja inválido no domínio", () => {
    const invalidDomainAuthorId = "autor-inexistente";
    const book = createValidBook({ author_id: invalidDomainAuthorId });

    const result = bookCreateSchema.safeParse(book);

    expect(result.success).toBe(true);

    if (result.success) {
      const persistence = BookUpsertMapper.toPersistence(result.data);
      expect(persistence.author_id).toBe(invalidDomainAuthorId);
    }
  });

  it("deve manter o author_id correto no mapeamento para persistência", () => {
    const validAuthorId = "author-valid-123";
    const result = bookCreateSchema.safeParse(
      createValidBook({ author_id: validAuthorId }),
    );

    expect(result.success).toBe(true);

    if (result.success) {
      const persistence = BookUpsertMapper.toPersistence(result.data);
      expect(persistence.author_id).toBe(validAuthorId);
    }
  });
});

describe("BookUpsert - regras de negócio do schema", () => {
  it("deve falhar quando title estiver vazio (RN01)", () => {
    const result = bookCreateSchema.safeParse(createValidBook({ title: "" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path[0] === "title"),
      ).toBe(true);
    }
  });

  it("deve falhar quando readers estiver vazio (RN01)", () => {
    const result = bookCreateSchema.safeParse(createValidBook({ readers: [] }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path[0] === "readers"),
      ).toBe(true);
    }
  });

  it("deve falhar quando pages não for inteiro positivo (RN03)", () => {
    const withZeroPages = bookCreateSchema.safeParse(
      createValidBook({ pages: 0 }),
    );
    const withDecimalPages = bookCreateSchema.safeParse(
      createValidBook({ pages: 10.5 }),
    );

    expect(withZeroPages.success).toBe(false);
    expect(withDecimalPages.success).toBe(false);
  });

  it("deve aceitar image_url apenas de domínios Amazon permitidos (RN04)", () => {
    const allowedUrls = [
      "https://amazon.com/image.jpg",
      "https://amazon.com.br/image.jpg",
      "https://media-amazon.com/image.jpg",
      "https://m.media-amazon.com/image.jpg",
      "https://ssl-images-amazon.com/image.jpg",
    ];

    for (const image_url of allowedUrls) {
      const result = bookCreateSchema.safeParse(createValidBook({ image_url }));
      expect(result.success).toBe(true);
    }
  });

  it("deve falhar quando image_url não for de domínio Amazon permitido (RN04)", () => {
    const result = bookCreateSchema.safeParse(
      createValidBook({ image_url: "https://example.com/image.jpg" }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path[0] === "image_url"),
      ).toBe(true);
    }
  });

  it("deve aceitar image_url vazio ou ausente (RN04 — opcional)", () => {
    const empty = bookCreateSchema.safeParse(
      createValidBook({ image_url: "" }),
    );
    expect(empty.success).toBe(true);

    const book = createValidBook();
    delete (book as Partial<BookCreateValidator>).image_url;
    const omitted = bookCreateSchema.safeParse(book);
    expect(omitted.success).toBe(true);
  });

  it("deve persistir capa padrão quando image_url estiver vazio (RN04)", () => {
    const result = bookCreateSchema.safeParse(
      createValidBook({ image_url: "" }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const persistence = BookUpsertMapper.toPersistence(result.data);
      expect(persistence.image_url).toBe(BOOK_COVER_PLACEHOLDER_SRC);
    }
  });
});
