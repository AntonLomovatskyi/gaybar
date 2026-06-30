/**
 * On-device user state (favourites, ratings, owned bar items, shopping, history, prefs).
 * Persisted via zustand + localStorage. The persisted JSON is the "user data" the future
 * backend will own — keep it serializable and versioned.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Cocktail } from "@/types/cocktail";

export interface PrepEntry {
  cocktailId: string;
  at: number; // epoch ms
}

export interface UserState {
  favourites: string[]; // cocktail ids
  ratings: Record<string, number>; // id -> 1..5
  notes: Record<string, string>; // id -> personal note
  ownedIngredients: string[]; // free-text names for now (canonical ids later)
  ownedTools: string[];
  shopping: Record<string, number>; // cocktailId -> servings
  boughtIngredients: string[]; // shopping-list lines ticked off as bought
  history: PrepEntry[];
  recentlyViewed: string[]; // cocktail ids, most-recent first (local only)
  prefs: { likedTags: string[]; dislikedTags: string[]; strength?: number };
  /** User-created recipes, merged into the catalog at runtime. */
  userRecipes: Cocktail[];
  /** When true, owning a generic ingredient satisfies a recipe's specific variant (substitutes). */
  flexibleMatching: boolean;
  language: "uk" | "en";
  units: "ml" | "oz";
  theme: "dark" | "light";

  setLanguage: (l: "uk" | "en") => void;
  setUnits: (u: "ml" | "oz") => void;
  setTheme: (t: "dark" | "light") => void;
  setFlexibleMatching: (v: boolean) => void;
  toggleFavourite: (id: string) => void;
  setRating: (id: string, stars: number) => void;
  setNote: (id: string, text: string) => void;
  addOwnedIngredient: (name: string) => void;
  removeOwnedIngredient: (name: string) => void;
  toggleOwnedTool: (name: string) => void;
  setShoppingServings: (id: string, servings: number) => void;
  clearShopping: () => void;
  toggleBought: (name: string) => void;
  clearBought: () => void;
  logPreparation: (id: string, at: number) => void;
  pushRecentlyViewed: (id: string) => void;
  setPrefs: (p: Partial<UserState["prefs"]>) => void;
  clearHistory: () => void;
  clearFavourites: () => void;
  addUserRecipe: (c: Cocktail) => void;
  removeUserRecipe: (id: string) => void;
  importData: (d: Partial<PersistedData>) => void;
}

/** The user-data fields that are exported/imported (backup & restore). */
export type PersistedData = Pick<
  UserState,
  | "favourites"
  | "ratings"
  | "notes"
  | "ownedIngredients"
  | "ownedTools"
  | "shopping"
  | "boughtIngredients"
  | "history"
  | "prefs"
  | "userRecipes"
  | "flexibleMatching"
  | "language"
  | "units"
  | "theme"
>;

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      favourites: [],
      ratings: {},
      notes: {},
      ownedIngredients: [],
      ownedTools: [],
      shopping: {},
      boughtIngredients: [],
      history: [],
      recentlyViewed: [],
      prefs: { likedTags: [], dislikedTags: [] },
      userRecipes: [],
      flexibleMatching: true,
      language: "uk",
      units: "ml",
      theme: "dark",

      setLanguage: (l) => set({ language: l }),
      setUnits: (u) => set({ units: u }),
      setTheme: (t) => set({ theme: t }),
      setFlexibleMatching: (v) => set({ flexibleMatching: v }),
      toggleFavourite: (id) =>
        set((s) => ({
          favourites: s.favourites.includes(id) ? s.favourites.filter((x) => x !== id) : [...s.favourites, id],
        })),
      setRating: (id, stars) => set((s) => ({ ratings: { ...s.ratings, [id]: stars } })),
      setNote: (id, text) =>
        set((s) => {
          const notes = { ...s.notes };
          if (text.trim()) notes[id] = text;
          else delete notes[id];
          return { notes };
        }),
      addOwnedIngredient: (name) =>
        set((s) => (s.ownedIngredients.includes(name) ? s : { ownedIngredients: [...s.ownedIngredients, name] })),
      removeOwnedIngredient: (name) => set((s) => ({ ownedIngredients: s.ownedIngredients.filter((x) => x !== name) })),
      toggleOwnedTool: (name) =>
        set((s) => ({
          ownedTools: s.ownedTools.includes(name) ? s.ownedTools.filter((x) => x !== name) : [...s.ownedTools, name],
        })),
      setShoppingServings: (id, servings) =>
        set((s) => {
          const next = { ...s.shopping };
          if (servings <= 0) delete next[id];
          else next[id] = servings;
          return { shopping: next };
        }),
      clearShopping: () => set({ shopping: {} }),
      toggleBought: (name) =>
        set((s) => ({
          boughtIngredients: s.boughtIngredients.includes(name)
            ? s.boughtIngredients.filter((x) => x !== name)
            : [...s.boughtIngredients, name],
        })),
      clearBought: () => set({ boughtIngredients: [] }),
      logPreparation: (id, at) => set((s) => ({ history: [{ cocktailId: id, at }, ...s.history].slice(0, 500) })),
      pushRecentlyViewed: (id) =>
        set((s) => ({ recentlyViewed: [id, ...s.recentlyViewed.filter((x) => x !== id)].slice(0, 12) })),
      setPrefs: (p) => set((s) => ({ prefs: { ...s.prefs, ...p } })),
      clearHistory: () => set({ history: [] }),
      clearFavourites: () => set({ favourites: [] }),
      addUserRecipe: (c) => set((s) => ({ userRecipes: [...s.userRecipes.filter((x) => x.id !== c.id), c] })),
      removeUserRecipe: (id) => set((s) => ({ userRecipes: s.userRecipes.filter((x) => x.id !== id) })),
      importData: (d) =>
        set((s) => ({
          favourites: d.favourites ?? s.favourites,
          ratings: d.ratings ?? s.ratings,
          notes: d.notes ?? s.notes,
          ownedIngredients: d.ownedIngredients ?? s.ownedIngredients,
          ownedTools: d.ownedTools ?? s.ownedTools,
          shopping: d.shopping ?? s.shopping,
          boughtIngredients: d.boughtIngredients ?? s.boughtIngredients,
          history: d.history ?? s.history,
          prefs: d.prefs ?? s.prefs,
          userRecipes: d.userRecipes ?? s.userRecipes,
          flexibleMatching: d.flexibleMatching ?? s.flexibleMatching,
          language: d.language ?? s.language,
          units: d.units ?? s.units,
          theme: d.theme ?? s.theme,
        })),
    }),
    {
      name: "gaybar/v1/user",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
