/**
 * Data-access seam for recipe data. TODAY: reads the bundled, generated array (offline).
 * LATER: swap the internals here for an HTTP client + react-query — screens/hooks that import
 * from `@/data/cocktails` never change. This is the one file that knows where recipes come from.
 */
import type { Cocktail, CocktailTag } from "@/types/cocktail";
import { cocktails as GENERATED } from "./generated/cocktails";
import { cardImages, type CardImages } from "./generated/images";

export function getAllCocktails(): Cocktail[] {
  return GENERATED;
}

export function getCocktailById(id: string): Cocktail | undefined {
  return GENERATED.find((c) => c.id === id);
}

export function getCardImages(id: string): CardImages | undefined {
  return cardImages[id];
}

export function getAllTags(): CocktailTag[] {
  const set = new Set<CocktailTag>();
  for (const c of GENERATED) for (const t of c.tags) set.add(t);
  return [...set];
}
