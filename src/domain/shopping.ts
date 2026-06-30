/**
 * Build a shopping list from chosen cocktails scaled by serving count, split into what you
 * already have (owned bar items + assumed pantry staples) vs what you still need to buy.
 * Matching is canonical (owning Куантро covers a recipe's Тріпл сек). Pure logic.
 */
import type { Cocktail } from "@/types/cocktail";
import { canonicalIdOf, isAssumedAvailable } from "@/data/catalog/ingredients";
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

export interface ShoppingSplit {
  need: ShoppingLine[]; // not in your bar / pantry — buy these
  have: ShoppingLine[]; // already on hand (owned or assumed pantry)
}

type Acc = ShoppingLine & { _units: Set<string>; have: boolean };

export function splitShoppingList(selections: ShoppingSelection[], ownedNames: string[] = []): ShoppingSplit {
  const owned = new Set(ownedNames.map(canonicalIdOf));
  const map = new Map<string, Acc>();

  for (const { cocktail, servings } of selections) {
    for (const ing of cocktail.ingredients) {
      if (!normalize(ing.name)) continue;
      const key = canonicalIdOf(ing.name);
      let line = map.get(key);
      if (!line) {
        line = {
          name: ing.name,
          amount: 0,
          unit: ing.unit,
          mixedUnits: false,
          fromCocktails: [],
          _units: new Set(),
          have: owned.has(key) || isAssumedAvailable(ing.name),
        };
        map.set(key, line);
      }
      if (!line.fromCocktails.includes(cocktail.name)) line.fromCocktails.push(cocktail.name);
      if (ing.unit) line._units.add(ing.unit);
      if (ing.amount != null) line.amount = (line.amount ?? 0) + ing.amount * Math.max(1, servings);
    }
  }

  const finalize = (l: Acc): ShoppingLine => {
    const units = [...l._units];
    const mixedUnits = units.length > 1;
    return {
      name: l.name,
      amount: mixedUnits || units.length === 0 ? undefined : l.amount,
      unit: mixedUnits ? undefined : units[0],
      mixedUnits,
      fromCocktails: l.fromCocktails,
    };
  };

  const all = [...map.values()];
  return {
    need: all.filter((l) => !l.have).map(finalize),
    have: all.filter((l) => l.have).map(finalize),
  };
}

/** Just the ingredients you still need to buy. */
export function buildShoppingList(selections: ShoppingSelection[], ownedNames: string[] = []): ShoppingLine[] {
  return splitShoppingList(selections, ownedNames).need;
}
