/** Preset mood tiles → tag query. Tapping a mood pre-filters the catalog. */
import type { CocktailTag } from "@/types/cocktail";

export interface Mood {
  key: string;
  labelUk: string;
  emoji: string;
  tags: CocktailTag[]; // OR within
}

export const MOODS: Mood[] = [
  { key: "sour", labelUk: "Щось кисленьке", emoji: "🍋", tags: ["кислі"] },
  { key: "sweet", labelUk: "Солоденьке", emoji: "🍯", tags: ["солодкі"] },
  { key: "strong", labelUk: "Міцненьке", emoji: "🥃", tags: ["міцні"] },
  { key: "tropical", labelUk: "Тропічне", emoji: "🏝️", tags: ["тропічні"] },
  { key: "berry", labelUk: "Ягідне", emoji: "🫐", tags: ["ягідні"] },
  { key: "citrus", labelUk: "Цитрусове", emoji: "🍊", tags: ["цитрусові"] },
  { key: "creamy", labelUk: "Вершкове", emoji: "🥛", tags: ["вершкові", "десерти"] },
  { key: "bitter", labelUk: "Гірке", emoji: "🌿", tags: ["гіркі"] },
  { key: "classic", labelUk: "Класика", emoji: "🎩", tags: ["класичні"] },
  { key: "zero", labelUk: "Без алкоголю", emoji: "🚫", tags: ["безалкогольні"] },
];

export const MOOD_BY_KEY: Record<string, Mood> = Object.fromEntries(MOODS.map((m) => [m.key, m]));
