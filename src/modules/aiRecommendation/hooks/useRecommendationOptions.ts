import { useMemo } from "react";

import type { RecommendationOption } from "../types/recommendation.types";

export function useRecommendationOptions(): RecommendationOption[] {
  return useMemo(
    () => [
      {
        type: "books_this_year",
        label: "Baseado nas leituras deste ano",
        description: "Sugestões alinhadas com seus livros de 2026.",
        icon: "📅",
      },
      {
        type: "books_last_year",
        label: "Baseado nas leituras de 2025",
        description: "Veja como seu gosto pode ter evoluído.",
        icon: "📆",
      },
      {
        type: "top_genre",
        label: "Baseado no seu gênero favorito",
        description: "Mais obras do gênero que você mais leu.",
        icon: "📚",
      },
      {
        type: "favorite_author",
        label: "Baseado no seu autor favorito",
        description: "Mais obras do autor que você mais leu.",
        icon: "✍️",
      },
      {
        type: "similar_to_last",
        label: "Mais como o último que terminei",
        description: "Livros parecidos com sua leitura mais recente.",
        icon: "🎯",
      },
      {
        type: "surprise_me",
        label: "Me surpreenda",
        description: "Algo fora da sua zona de conforto.",
        icon: "🎲",
      },
    ],
    [],
  );
}

export default useRecommendationOptions;
