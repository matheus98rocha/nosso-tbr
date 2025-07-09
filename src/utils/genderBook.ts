export const genders = [
  { label: "Romance", value: "romance" },
  { label: "Romance de época", value: "historical_romance" },
  {
    label: "Romance contemporâneo",
    value: "contemporary_romance",
  },
  { label: "Fantasia", value: "fantasy" },
  { label: "Romantasia", value: "romantasy" },
  { label: "Realismo mágico", value: "magical_realism" },
  { label: "Ficção científica", value: "science_fiction" },
  { label: "Distopia", value: "dystopia" },
  { label: "Cozy (Livros aconchegantes)", value: "cozy" },
  { label: "Cozy Mistery", value: "cozy_mystery" },
  { label: "Cozy Fantasy", value: "cozy_fantasy" },
  { label: "Mistério", value: "mystery" },
  { label: "Suspense", value: "thriller" },
  { label: "Terror", value: "horror" },
  { label: "Ficção", value: "fiction" },
  {
    label: "Ficção contemporânea",
    value: "contemporary_fiction",
  },
  { label: "Ciência social", value: "social_science" },
  { label: "Clássico", value: "classic" },
];

export const getGenderLabel = (value: string | undefined) => {
  return genders.find((g) => g.value === value)?.label ?? value;
};

export const genreColorMap: Record<string, string> = {
  romance: "bg-violet-400 text-white",
  historical_romance: "bg-fuchsia-300 text-white",
  contemporary_romance: "bg-purple-500 text-white",

  fantasy: "bg-yellow-700 text-white",
  romantasy: "bg-amber-200 text-black",
  magical_realism: "bg-blue-300 text-black",

  science_fiction: "bg-zinc-500 text-white",
  dystopia: "bg-neutral-500 text-white",

  cozy: "bg-lime-200 text-black",
  cozy_mystery: "bg-lime-200 text-black",
  cozy_fantasy: "bg-lime-200 text-black",

  mystery: "bg-red-800 text-white",
  thriller: "bg-red-800 text-white",
  horror: "bg-red-800 text-white",

  fiction: "bg-rose-900 text-white",
  contemporary_fiction: "bg-rose-900 text-white",

  classic: "bg-stone-600 text-white",
  social_science: "bg-sky-200 text-black",
};

export const getGenreBadgeColor = (value: string | undefined) =>
  genreColorMap[value ?? ""] ?? "bg-gray-300 text-black";
