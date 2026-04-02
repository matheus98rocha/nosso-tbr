import { levenshteinDistance } from "@/utils/levenshteinDistance";
import { normalizeForBookTitleSearch } from "@/utils/normalizeForBookTitleSearch";
import {
  BookCatalogCandidate,
  BookCatalogMatchResult,
} from "../types/bookDiscovery.types";
import { userParticipatesInBook } from "./bookCatalogDiscovery.rules";

function buildDistanceThreshold(normalizedTitle: string): number {
  return Math.max(2, Math.floor(normalizedTitle.length * 0.2));
}

function sortByDistance(
  left: { candidate: BookCatalogCandidate; distance: number },
  right: { candidate: BookCatalogCandidate; distance: number },
): number {
  if (left.distance !== right.distance) {
    return left.distance - right.distance;
  }

  return left.candidate.title.localeCompare(right.candidate.title, "pt-BR");
}

export class BookCatalogMatchService {
  findBestMatch(params: {
    title: string;
    authorId: string;
    currentUserId?: string;
    candidates: BookCatalogCandidate[];
  }): BookCatalogMatchResult | null {
    const normalizedInputTitle = normalizeForBookTitleSearch(params.title);
    if (!normalizedInputTitle) {
      return null;
    }

    const authorCandidates = params.candidates.filter(
      (candidate) => candidate.authorId === params.authorId,
    );

    if (authorCandidates.length === 0) {
      return null;
    }

    const exactMatch = authorCandidates.find((candidate) => {
      const normalizedCandidateTitle = normalizeForBookTitleSearch(candidate.title);
      return normalizedCandidateTitle === normalizedInputTitle;
    });

    if (exactMatch) {
      const participates = userParticipatesInBook(
        params.currentUserId,
        exactMatch.chosenBy,
        exactMatch.readers ?? [],
      );
      return {
        candidate: exactMatch,
        kind: "exact",
        userAlreadyLinked: participates,
        suggestJoinEligible: false,
      };
    }

    const bestApproximate = authorCandidates
      .map((candidate) => {
        const normalizedCandidateTitle = normalizeForBookTitleSearch(candidate.title);
        const distance = levenshteinDistance(
          normalizedInputTitle,
          normalizedCandidateTitle,
        );
        return { candidate, distance };
      })
      .sort(sortByDistance)[0];

    if (!bestApproximate) {
      return null;
    }

    const threshold = buildDistanceThreshold(normalizedInputTitle);
    if (bestApproximate.distance > threshold) {
      return null;
    }

    const cand = bestApproximate.candidate;
    const participates = userParticipatesInBook(
      params.currentUserId,
      cand.chosenBy,
      cand.readers ?? [],
    );
    return {
      candidate: cand,
      kind: "approximate",
      userAlreadyLinked: participates,
      suggestJoinEligible: false,
    };
  }
}
