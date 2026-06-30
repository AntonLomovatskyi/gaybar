/** Ephemeral discovery filter state (selected tags + sort). Not persisted. */
import { create } from "zustand";
import type { CocktailTag } from "@/types/cocktail";
import type { SortMode, StrengthBucket } from "@/domain/cocktails";

/** "all" = no strength filter; otherwise restrict to one bucket. */
export type StrengthFilter = "all" | StrengthBucket;

interface FilterState {
  tags: CocktailTag[];
  glasses: string[]; // canonical glass ids
  sort: SortMode;
  query: string;
  onlyMakeable: boolean;
  onlyEasy: boolean;
  strength: StrengthFilter;
  toggleTag: (t: CocktailTag) => void;
  setTags: (t: CocktailTag[]) => void;
  toggleGlass: (id: string) => void;
  setSort: (s: SortMode) => void;
  setQuery: (q: string) => void;
  setOnlyMakeable: (v: boolean) => void;
  setOnlyEasy: (v: boolean) => void;
  setStrength: (v: StrengthFilter) => void;
  clear: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  tags: [],
  glasses: [],
  sort: "card",
  query: "",
  onlyMakeable: false,
  onlyEasy: false,
  strength: "all",
  toggleTag: (t) => set((s) => ({ tags: s.tags.includes(t) ? s.tags.filter((x) => x !== t) : [...s.tags, t] })),
  setTags: (t) => set({ tags: t }),
  toggleGlass: (id) =>
    set((s) => ({ glasses: s.glasses.includes(id) ? s.glasses.filter((x) => x !== id) : [...s.glasses, id] })),
  setSort: (s) => set({ sort: s }),
  setQuery: (q) => set({ query: q }),
  setOnlyMakeable: (v) => set({ onlyMakeable: v }),
  setOnlyEasy: (v) => set({ onlyEasy: v }),
  setStrength: (v) => set({ strength: v }),
  clear: () => set({ tags: [], glasses: [] }),
}));
