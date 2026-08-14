export type DiceBearAvatarOptions = {
  skinColor?: string;
  backgroundColor?: string;
  hairColor?: string;
  top?: string;
  clothing?: string;
  clothesColor?: string;
  accessories?: string;
  accessoriesProbability?: number;
  facialHair?: string;
  facialHairProbability?: number;
};

export type AvatarCatalogEntry = {
  seed: string;
  options: DiceBearAvatarOptions;
};
