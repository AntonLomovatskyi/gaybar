/**
 * Maps the 50 flat tags onto axes so the filter UI shows grouped chips instead of a wall.
 * Hand-authored from the COCKTAIL_TAGS groups in src/types/cocktail.ts.
 */
import type { CocktailTag } from "@/types/cocktail";

export type TagGroupKey = "strength" | "taste" | "base" | "family" | "appearance";

export const TAG_GROUPS: { key: TagGroupKey; labelUk: string; tags: CocktailTag[] }[] = [
  {
    key: "strength",
    labelUk: "Міцність",
    tags: ["міцні", "слабоалкогольні", "безалкогольні"],
  },
  {
    key: "taste",
    labelUk: "Смак",
    tags: [
      "кислі",
      "солодкі",
      "солоні",
      "гіркі",
      "сухі",
      "пряні",
      "пікантні",
      "цитрусові",
      "фруктові",
      "ягідні",
      "тропічні",
      "трав'яні",
      "м'ятні",
      "квіткові",
      "овочеві",
      "зелені",
      "вершкові",
      "мигдалеві",
      "кавові",
      "шоколадні",
    ],
  },
  {
    key: "base",
    labelUk: "Основа",
    tags: [
      "на горілці",
      "на джині",
      "на ромі",
      "на текілі",
      "на віскі",
      "на бурбоні",
      "на вермуті",
      "на вині",
      "на ігристому",
      "на мескалю",
      "на піско",
      "на соку",
      "на газованій воді",
    ],
  },
  {
    key: "family",
    labelUk: "Тип",
    tags: ["класичні", "десерти", "театр", "твісти", "лонги", "шорти", "шоти", "колінзи", "фізи", "сауери", "мартіні"],
  },
  {
    key: "appearance",
    labelUk: "Вигляд",
    tags: ["бежеві", "коричневі", "прозорі"],
  },
];

export const TAG_TO_GROUP: Record<string, TagGroupKey> = Object.fromEntries(
  TAG_GROUPS.flatMap((g) => g.tags.map((t) => [t, g.key] as const)),
);

/** Strength ordering for sort (low → high). */
export const STRENGTH_ORDINAL: Record<string, number> = {
  безалкогольні: 0,
  слабоалкогольні: 1,
  міцні: 2,
};

export function strengthOf(tags: readonly string[]): number {
  for (const t of tags) if (t in STRENGTH_ORDINAL) return STRENGTH_ORDINAL[t];
  return 1;
}
