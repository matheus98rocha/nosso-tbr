import type { WelcomeTutorialStep } from "../types/onboarding.types";

export const WELCOME_TUTORIAL_STEPS: WelcomeTutorialStep[] = [
  {
    id: "follow",
    title: "Siga outros leitores",
    description:
      "Na Comunidade você encontra pessoas com gostos parecidos e acompanha o que elas estão lendo.",
    ctaLabel: "Ver recomendações",
  },
  {
    id: "books",
    title: "Cadastre seus livros",
    description:
      "Monte sua lista com o que quer ler ou já leu. O cadastro é seu, no seu ritmo.",
    ctaLabel: "Adicionar livro",
  },
  {
    id: "ai",
    title: "Peça indicação com IA",
    description:
      "A Indicação com IA usa o seu histórico real do app para sugerir a próxima leitura.",
    ctaLabel: "Abrir indicação com IA",
  },
];
