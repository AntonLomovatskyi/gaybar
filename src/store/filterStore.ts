/** Ephemeral discovery filter state (selected tags + sort). Not persisted. */
import { create } from "zustand";
import type { CocktailTag } from "@/types/cocktail";
import type { SortMode } from "@/domain/cocktails";

interface FilterState {
  tags: CocktailTag[];
  sort: SortMode;
  toggleTag: (t: CocktailTag) => void;
  setTags: (t: CocktailTag[]) => void;
  clear: () => void;
  setSort: (s: SortMode) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  tags: [],
  sort: "card",
  toggleTag: (t) => set((s) => ({ tags: s.tags.includes(t) ? s.tags.filter((x) => x !== t) : [...s.tags, t] })),
  setTags: (t) => set({ tags: t }),
  clear: () => set({ tags: [] }),
  setSort: (s) => set({ sort: s }),
}));
