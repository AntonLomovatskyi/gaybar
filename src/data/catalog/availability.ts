/**
 * Cocktail-level Chernivtsi availability, derived from the reviewed ingredient catalog.
 */
import type { Cocktail } from "@/types/cocktail";
import { isIgnorable } from "@/domain/inventory";
import { availabilityOf, type Availability } from "./ingredients";

export type { Availability };
export { availabilityOf };

export interface CocktailAvailability {
  tier: Availability;
  specialty: string[];
  rare: string[];
  score: number; // lower = more locally available
}

export function cocktailAvailability(c: Cocktail): CocktailAvailability {
  const specialty: string[] = [];
  const rare: string[] = [];
  for (const ing of c.ingredients) {
    if (isIgnorable(ing)) continue;
    const a = availabilityOf(ing.name);
    if (a === "rare") rare.push(ing.name);
    else if (a === "specialty") specialty.push(ing.name);
  }
  const tier: Availability = rare.length ? "rare" : specialty.length ? "specialty" : "common";
  return { tier, specialty, rare, score: rare.length * 3 + specialty.length };
}
