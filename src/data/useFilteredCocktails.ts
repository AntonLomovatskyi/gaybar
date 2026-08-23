/**
 * The collection's filtered list, in one place. The home screen renders it and the random
 * walk draws from it, so "випадковий з відфільтрованих" always means exactly what's on screen.
 */
import { useMemo } from "react";
import { applyFilters, sortBy, strengthBucket } from "@/domain/cocktails";
import { whatCanIMake } from "@/domain/inventory";
import { useFilterStore } from "@/store/filterStore";
import { useUserStore } from "@/store/userStore";
import type { Cocktail } from "@/types/cocktail";
import { useAllCocktails } from "./useCocktails";

/** Ice doesn't count against "прості" — three real ingredients is still easy. */
const easyCount = (c: Cocktail) => c.ingredients.filter((i) => !i.name.toLowerCase().includes("лід")).length;

export interface FilteredCocktails {
  all: Cocktail[];
  list: Cocktail[];
  makeableIds: Set<string>;
  /** Rated or logged as made at least once. */
  triedIds: Set<string>;
  /** Nothing selected and nothing typed — the plain home screen. */
  isHome: boolean;
  filterCount: number;
}

export function useFilteredCocktails(): FilteredCocktails {
  const all = useAllCocktails();
  const tags = useFilterStore((s) => s.tags);
  const glasses = useFilterStore((s) => s.glasses);
  const sort = useFilterStore((s) => s.sort);
  const query = useFilterStore((s) => s.query);
  const onlyMakeable = useFilterStore((s) => s.onlyMakeable);
  const onlyEasy = useFilterStore((s) => s.onlyEasy);
  const strength = useFilterStore((s) => s.strength);
  const tasted = useFilterStore((s) => s.tasted);
  const ratings = useUserStore((s) => s.ratings);
  const history = useUserStore((s) => s.history);
  const ownedIngredients = useUserStore((s) => s.ownedIngredients);
  const flexibleMatching = useUserStore((s) => s.flexibleMatching);

  const makeableIds = useMemo(
    () => new Set(whatCanIMake(all, ownedIngredients, flexibleMatching).makeable.map((m) => m.cocktail.id)),
    [all, ownedIngredients, flexibleMatching],
  );
  const triedIds = useMemo(() => {
    const s = new Set(history.map((h) => h.cocktailId));
    for (const [id, stars] of Object.entries(ratings)) if (stars > 0) s.add(id);
    return s;
  }, [history, ratings]);

  const list = useMemo(() => {
    let base = applyFilters(all, { tags, glasses, query });
    if (onlyMakeable) base = base.filter((c) => makeableIds.has(c.id));
    if (onlyEasy) base = base.filter((c) => easyCount(c) <= 3);
    if (strength !== "all") base = base.filter((c) => strengthBucket(c) === strength);
    if (tasted === "tried") base = base.filter((c) => triedIds.has(c.id));
    else if (tasted === "untried") base = base.filter((c) => !triedIds.has(c.id));
    return sortBy(base, sort, ratings);
  }, [all, tags, glasses, query, sort, onlyMakeable, onlyEasy, strength, tasted, triedIds, makeableIds, ratings]);

  const filterCount = tags.length + glasses.length;
  const isHome =
    !query.trim() && filterCount === 0 && !onlyMakeable && !onlyEasy && strength === "all" && tasted === "all";

  return { all, list, makeableIds, triedIds, isHome, filterCount };
}
