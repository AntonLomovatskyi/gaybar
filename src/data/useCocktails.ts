/**
 * Reactive cocktail access that merges bundled recipes with the user's own (from the store).
 * Screens use these hooks so user-added recipes appear everywhere and update live.
 */
import { useMemo } from "react";
import type { Cocktail } from "@/types/cocktail";
import { useUserStore } from "@/store/userStore";
import { getAllCocktails, getCocktailById } from "./cocktails";

export function useAllCocktails(): Cocktail[] {
  const userRecipes = useUserStore((s) => s.userRecipes);
  return useMemo(() => [...getAllCocktails(), ...userRecipes], [userRecipes]);
}

export function useCocktailById(id: string | undefined): Cocktail | undefined {
  const userRecipes = useUserStore((s) => s.userRecipes);
  return useMemo(() => {
    if (!id) return undefined;
    return getCocktailById(id) ?? userRecipes.find((c) => c.id === id);
  }, [id, userRecipes]);
}
