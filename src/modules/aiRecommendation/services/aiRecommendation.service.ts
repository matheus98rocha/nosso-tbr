import type {
  RecommendationRequest,
  RecommendationResponse,
} from "../types/recommendation.types";

async function fetchRecommendation(
  payload: RecommendationRequest,
  signal?: AbortSignal,
): Promise<RecommendationResponse> {
  const response = await fetch("/api/ai/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new Error("Não foi possível gerar a recomendação no momento.");
  }

  return response.json();
}

export default fetchRecommendation;
