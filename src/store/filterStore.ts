/** Ephemeral discovery filter state (selected tags + sort). Not persisted. */
import { create } from "zustand";
import type { CocktailTag } from "@/types/cocktail";
import type { SortMode, StrengthBucket } from "@/domain/cocktails";

/** "all" = no strength filter; otherwise restrict to one bucket. */
export type StrengthFilter = "all" | StrengthBucket;

/** "all" = no filter; "tried" = rated/made; "untried" = not yet. */
export type TastedFilter = "all" | "tried" | "untried";

interface FilterState {
  tags: CocktailTag[];
  glasses: string[]; // canonical glass ids
  sort: SortMode;
  query: string;
  onlyMakeable: boolean;
  onlyEasy: boolean;
  strength: StrengthFilter;
  tasted: TastedFilter;
  /**
   * Position in the shuffled random walk. Shared so the home card and the recipe page step
   * through the same sequence — walk forward on a recipe, go back, and the card is in sync.
   */
  randomStep: number;
  toggleTag: (t: CocktailTag) => void;
  setTags: (t: CocktailTag[]) => void;
  toggleGlass: (id: string) => void;
  setSort: (s: SortMode) => void;
  setQuery: (q: string) => void;
  setOnlyMakeable: (v: boolean) => void;
  setOnlyEasy: (v: boolean) => void;
  setStrength: (v: StrengthFilter) => void;
  setTasted: (v: TastedFilter) => void;
  setRandomStep: (n: number) => void;
  clear: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  tags: [],
  glasses: [],
  sort: "card",
  query: "",
  onlyMakeable: true,
  onlyEasy: false,
  strength: "all",
  tasted: "all",
  randomStep: 0,
  toggleTag: (t) => set((s) => ({ tags: s.tags.includes(t) ? s.tags.filter((x) => x !== t) : [...s.tags, t] })),
  setTags: (t) => set({ tags: t }),
  toggleGlass: (id) =>
    set((s) => ({ glasses: s.glasses.includes(id) ? s.glasses.filter((x) => x !== id) : [...s.glasses, id] })),
  setSort: (s) => set({ sort: s }),
  setQuery: (q) => set({ query: q }),
  setOnlyMakeable: (v) => set({ onlyMakeable: v }),
  setOnlyEasy: (v) => set({ onlyEasy: v }),
  setStrength: (v) => set({ strength: v }),
  setTasted: (v) => set({ tasted: v }),
  setRandomStep: (n) => set({ randomStep: n }),
  clear: () => set({ tags: [], glasses: [] }),
}));
