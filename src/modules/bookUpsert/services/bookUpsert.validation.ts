import { Status } from "@/types/books.types";
import {
  BadRequestError,
  RepositoryError,
} from "@/services/errors/error";
import {
  LOCKED_BOOK_STATUSES,
  NON_CREATABLE_BOOK_STATUSES,
} from "@/constants/bookStatuses";
export function ensureCreatableStatus(status?: Status) {
  if (status && NON_CREATABLE_BOOK_STATUSES.includes(status)) {
    throw new RepositoryError(
      "Livros não podem ser criados com status pausado ou abandonado.",
    );
  }
}

export function validateTransition(
  currentBook: { status?: Status; start_date?: string | null },
  nextStatus?: Status,
  nextStartDate?: string | null,
) {
  if (nextStatus && LOCKED_BOOK_STATUSES.includes(nextStatus)) {
    if (currentBook.status !== "reading") {
      throw new BadRequestError(
        "Status pausado e abandonado só podem ser aplicados a livros em andamento.",
      );
    }
  }

  if (
    currentBook.status === "abandoned" &&
    nextStatus === "reading" &&
    !nextStartDate
  ) {
    throw new BadRequestError(
      "Para retomar um livro abandonado, informe uma nova data de início.",
    );
  }
}

export type CurrentBookRow = {
  status?: Status;
  start_date?: string | null;
  end_date?: string | null;
};
