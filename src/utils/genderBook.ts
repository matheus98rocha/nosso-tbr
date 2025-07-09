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
