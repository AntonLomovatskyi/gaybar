/**
 * The cooking journal, per cocktail — pure logic. Ratings belong to the cocktail itself
 * (`ratings[id]`); a journal entry only records that you made it, when, and a note.
 */
import type { Cocktail } from "@/types/cocktail";
import { compareUk } from "./text";

/** One "Я приготував(-ла)" entry. `rating` is legacy: old entries carried a per-make rating. */
export interface MakeEntry {
  cocktailId: string;
  at: number;
  note?: string;
  rating?: number;
}

export interface CookedCocktail {
  cocktail: Cocktail;
  /** How many times you logged making it. */
  times: number;
  lastAt: number;
  /** Your rating of the cocktail, 0 when not rated. */
  rating: number;
}

/** Every cocktail you've logged making at least once, newest first. Unknown ids are skipped. */
export function cookedCocktails(
  all: Cocktail[],
  history: MakeEntry[],
  ratings: Record<string, number>,
): CookedCocktail[] {
  const byId = new Map(all.map((c) => [c.id, c]));
  const seen = new Map<string, CookedCocktail>();
  for (const e of history) {
    const cocktail = byId.get(e.cocktailId);
    if (!cocktail) continue;
    const row = seen.get(e.cocktailId);
    if (row) {
      row.times += 1;
      row.lastAt = Math.max(row.lastAt, e.at);
    } else {
      seen.set(e.cocktailId, { cocktail, times: 1, lastAt: e.at, rating: ratings[e.cocktailId] ?? 0 });
    }
  }
  return [...seen.values()].sort((a, b) => b.lastAt - a.lastAt);
}

/** "all", one exact star count, or not rated yet. */
export type RatingFilter = "all" | "unrated" | 1 | 2 | 3 | 4 | 5;

export function filterByRating(list: CookedCocktail[], filter: RatingFilter): CookedCocktail[] {
  if (filter === "all") return list;
  if (filter === "unrated") return list.filter((x) => !x.rating);
  return list.filter((x) => x.rating === filter);
}

export type CookedSort = "recent" | "rating" | "times";

export function sortCooked(list: CookedCocktail[], sort: CookedSort): CookedCocktail[] {
  const arr = [...list];
  switch (sort) {
    case "rating":
      return arr.sort((a, b) => b.rating - a.rating || b.lastAt - a.lastAt);
    case "times":
      return arr.sort((a, b) => b.times - a.times || b.lastAt - a.lastAt);
    default:
      return arr.sort((a, b) => b.lastAt - a.lastAt || compareUk(a.cocktail.name, b.cocktail.name));
  }
}

/**
 * Move old per-make ratings onto the cocktail. A cocktail you already rated keeps its rating;
 * otherwise it takes the most recent rating you gave one of its makes. The entries come back
 * without a rating. Safe to run more than once.
 */
export function foldMakeRatings<E extends MakeEntry>(
  history: E[],
  ratings: Record<string, number>,
): { history: E[]; ratings: Record<string, number> } {
  const next = { ...ratings };
  const newestFirst = [...history].sort((a, b) => b.at - a.at);
  for (const e of newestFirst) {
    if (e.rating && e.rating > 0 && !(next[e.cocktailId] > 0)) next[e.cocktailId] = e.rating;
  }
  const stripped = history.map((e) => {
    if (e.rating === undefined) return e;
    const copy = { ...e };
    delete copy.rating;
    return copy;
  });
  return { history: stripped, ratings: next };
}
