/** Ephemeral discovery filter state (selected tags + sort). Not persisted. */
import { create } from "zustand";
import type { CocktailTag } from "@/types/cocktail";
import type { SortMode } from "@/domain/cocktails";

interface FilterState {
  tags: CocktailTag[];
  glasses: string[]; // canonical glass ids
  sort: SortMode;
  toggleTag: (t: CocktailTag) => void;
  setTags: (t: CocktailTag[]) => void;
  toggleGlass: (id: string) => void;
  clear: () => void;
  setSort: (s: SortMode) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  tags: [],
  glasses: [],
  sort: "card",
  toggleTag: (t) => set((s) => ({ tags: s.tags.includes(t) ? s.tags.filter((x) => x !== t) : [...s.tags, t] })),
  setTags: (t) => set({ tags: t }),
  toggleGlass: (id) =>
    set((s) => ({ glasses: s.glasses.includes(id) ? s.glasses.filter((x) => x !== id) : [...s.glasses, id] })),
  clear: () => set({ tags: [], glasses: [] }),
  setSort: (s) => set({ sort: s }),
}));
