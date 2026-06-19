/**
 * Build a shopping list from chosen cocktails scaled by serving count, minus what's owned.
 * Pure logic. Aggregates by (normalized name + unit); upgrades to canonical ids with the
 * dictionary later.
 */
import type { Cocktail } from "@/types/cocktail";
import { normalize } from "./text";

export interface ShoppingSelection {
  cocktail: Cocktail;
  servings: number; // each card = 1 serving
}

export interface ShoppingLine {
  name: string; // display name (first-seen spelling)
  amount?: number; // summed, when all contributing rows share a unit
  unit?: string;
  mixedUnits?: boolean; // true if same ingredient appeared with differing units
  fromCocktails: string[]; // cocktail names that need it
}

export function buildShoppingList(selections: ShoppingSelection[], ownedNames: string[] = []): ShoppingLine[] {
  const owned = new Set(ownedNames.map(normalize));
  const map = new Map<string, ShoppingLine & { _units: Set<string> }>();

  for (const { cocktail, servings } of selections) {
    for (const ing of cocktail.ingredients) {
      const key = normalize(ing.name);
      if (!key || owned.has(key)) continue;
      let line = map.get(key);
      if (!line) {
        line = { name: ing.name, amount: 0, unit: ing.unit, mixedUnits: false, fromCocktails: [], _units: new Set() };
        map.set(key, line);
      }
      if (!line.fromCocktails.includes(cocktail.name)) line.fromCocktails.push(cocktail.name);
      if (ing.unit) line._units.add(ing.unit);
      if (ing.amount != null) line.amount = (line.amount ?? 0) + ing.amount * Math.max(1, servings);
    }
  }

  return [...map.values()].map((l) => {
    const units = [...l._units];
    const mixedUnits = units.length > 1;
    return {
      name: l.name,
      amount: mixedUnits || units.length === 0 ? undefined : l.amount,
      unit: mixedUnits ? undefined : units[0],
      mixedUnits,
      fromCocktails: l.fromCocktails,
    };
  });
}
