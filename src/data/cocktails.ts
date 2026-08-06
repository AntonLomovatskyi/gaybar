/**
 * Data-access seam for recipe data. TODAY: reads the bundled, generated array (offline).
 * LATER: swap the internals here for an HTTP client + react-query — screens/hooks that import
 * from `@/data/cocktails` never change. This is the one file that knows where recipes come from.
 */
import type { Cocktail, CocktailTag } from "@/types/cocktail";
import { cocktails as GENERATED } from "./generated/cocktails";
import { importedCocktails as IMPORTED } from "./generated/importedCocktails";
import { importedCardImages } from "./generated/importedImages";
import { cardImages, type CardImages } from "./generated/images";
import { researchedCocktails as RESEARCHED } from "./generated/researchedCocktails";
import { researchedImages } from "./generated/researchedImages";
import { shotCocktails as SHOTS } from "./generated/shotCocktails";
import { shotImages } from "./generated/shotImages";

// The physical deck first, then TheCocktailDB imports, web-researched recipes, and the
// "Шоти Там" bar menu.
const ALL: Cocktail[] = [...GENERATED, ...IMPORTED, ...RESEARCHED, ...SHOTS];

/** Bundled art lives under public/ — resolve it against the deploy base path. */
const asUrl = (p: string): string => (/^https?:\/\//.test(p) ? p : import.meta.env.BASE_URL + p);

export function getAllCocktails(): Cocktail[] {
  return ALL;
}

export function getCocktailById(id: string): Cocktail | undefined {
  return ALL.find((c) => c.id === id);
}

export function getCardImages(id: string): CardImages | undefined {
  if (cardImages[id]) return cardImages[id];
  if (importedCardImages[id]) return importedCardImages[id];
  const art = researchedImages[id] ?? shotImages[id];
  return art ? { front: asUrl(art) } : undefined;
}

export function getAllTags(): CocktailTag[] {
  const set = new Set<CocktailTag>();
  for (const c of ALL) for (const t of c.tags) set.add(t);
  return [...set];
}
