/**
 * The random-cocktail walk: one shuffled sequence over the currently filtered drinks that both
 * the home card and the recipe page step through. Opening a pick keeps you in the walk, so
 * "next" is one tap on the recipe itself instead of back-out, next, tap-in.
 */
import { useMemo } from "react";
import { dailySeed, pickAtStep, shuffleSeeded } from "@/domain/random";
import { useFilterStore } from "@/store/filterStore";
import type { Cocktail } from "@/types/cocktail";
import type { FilteredCocktails } from "./useFilteredCocktails";

export interface RandomWalk {
  /** The drink at the current step. */
  pick: Cocktail | null;
  /** Resolve any step without moving — the recipe page walks by its URL step. */
  at: (step: number) => Cocktail | null;
  step: number;
  setStep: (step: number) => void;
  poolSize: number;
  /** True when no filter is active, i.e. the pool is the whole bar-first pick. */
  isHome: boolean;
}

/**
 * Takes the filtered set rather than deriving it, so a screen that already has one (the home
 * list) doesn't pay for filtering the whole catalogue twice.
 */
export function useRandomWalk({ all, list, isHome, makeableIds }: FilteredCocktails): RandomWalk {
  const step = useFilterStore((s) => s.randomStep);
  const setStep = useFilterStore((s) => s.setRandomStep);

  // Filtered: the pool is exactly what's on screen — pick "Хайбол" and it stops offering shots.
  // Unfiltered: prefer what the bar can actually pour, so the daily pick is makeable right now.
  const pool = useMemo(() => {
    if (!isHome) return list;
    const fromBar = all.filter((c) => makeableIds.has(c.id));
    return fromBar.length >= 5 ? fromBar : all;
  }, [isHome, list, all, makeableIds]);

  // One order per day per pool: the pick is stable while you browse, fresh tomorrow.
  const order = useMemo(() => shuffleSeeded(pool, dailySeed(Date.now())), [pool]);

  return {
    pick: pickAtStep(order, step),
    at: (s: number) => pickAtStep(order, s),
    step,
    setStep,
    poolSize: order.length,
    isHome,
  };
}
