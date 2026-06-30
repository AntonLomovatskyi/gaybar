/** Ephemeral discovery filter state (selected tags + sort). Not persisted. */
import { create } from "zustand";
import type { CocktailTag } from "@/types/cocktail";
import type { SortMode } from "@/domain/cocktails";

interface FilterState {
  tags: CocktailTag[];
  glasses: string[]; // canonical glass ids
  sort: SortMode;
  query: string;
  onlyMakeable: boolean;
  onlyEasy: boolean;
  toggleTag: (t: CocktailTag) => void;
  setTags: (t: CocktailTag[]) => void;
  toggleGlass: (id: string) => void;
  setSort: (s: SortMode) => void;
  setQuery: (q: string) => void;
  setOnlyMakeable: (v: boolean) => void;
  setOnlyEasy: (v: boolean) => void;
  clear: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  tags: [],
  glasses: [],
  sort: "card",
  query: "",
  onlyMakeable: false,
  onlyEasy: false,
  toggleTag: (t) => set((s) => ({ tags: s.tags.includes(t) ? s.tags.filter((x) => x !== t) : [...s.tags, t] })),
  setTags: (t) => set({ tags: t }),
  toggleGlass: (id) =>
    set((s) => ({ glasses: s.glasses.includes(id) ? s.glasses.filter((x) => x !== id) : [...s.glasses, id] })),
  setSort: (s) => set({ sort: s }),
  setQuery: (q) => set({ query: q }),
  setOnlyMakeable: (v) => set({ onlyMakeable: v }),
  setOnlyEasy: (v) => set({ onlyEasy: v }),
  clear: () => set({ tags: [], glasses: [] }),
}));
