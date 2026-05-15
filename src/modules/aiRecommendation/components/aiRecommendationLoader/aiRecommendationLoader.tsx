"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const ROTATING_MESSAGES = [
  "Analisando seu perfil de leitura…",
  "Garimpando livros que combinam com você…",
  "Cruzando autores e gêneros favoritos…",
  "Descartando livros que já estão na sua biblioteca…",
  "Quase lá, montando suas indicações…",
];

const ROTATION_INTERVAL_MS = 1800;

function AiRecommendationLoader() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % ROTATING_MESSAGES.length);
    }, ROTATION_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-10"
      role="status"
      aria-live="polite"
    >
      <Loader2
        className="size-8 animate-spin text-violet-600 dark:text-violet-300"
        aria-hidden
      />
      <p className="text-sm text-zinc-700 dark:text-zinc-300 text-center min-h-[20px] transition-opacity">
        {ROTATING_MESSAGES[index]}
      </p>
      <div className="flex w-full max-w-xs flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 p-2 animate-pulse"
          >
            <div className="size-10 shrink-0 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex flex-1 flex-col justify-center gap-2">
              <div className="h-3 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AiRecommendationLoader;
