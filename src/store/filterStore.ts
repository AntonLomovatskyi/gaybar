/** Ephemeral discovery filter state (selected tags + sort). Not persisted. */
import { create } from "zustand";
import type { CocktailTag } from "@/types/cocktail";
import type { DrinkKindFilter, SortMode, StrengthBucket, TastedFilter } from "@/domain/cocktails";
import type { CookedSort, RatingFilter } from "@/domain/journal";

export type { DrinkKindFilter, TastedFilter };

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
  tasted: TastedFilter;
  /** Shots vs cocktails on the main list. */
  kind: DrinkKindFilter;
  /**
   * Position in the shuffled random walk. Shared so the home card and the recipe page step
   * through the same sequence — walk forward on a recipe, go back, and the card is in sync.
   */
  randomStep: number;
  /** Journal screen: per-cocktail list or every entry, plus its rating filter and sort. */
  journalView: "cooked" | "log";
  journalRating: RatingFilter;
  journalSort: CookedSort;
  toggleTag: (t: CocktailTag) => void;
  setTags: (t: CocktailTag[]) => void;
  toggleGlass: (id: string) => void;
  setSort: (s: SortMode) => void;
  setQuery: (q: string) => void;
  setOnlyMakeable: (v: boolean) => void;
  setOnlyEasy: (v: boolean) => void;
  setStrength: (v: StrengthFilter) => void;
  setTasted: (v: TastedFilter) => void;
  setKind: (v: DrinkKindFilter) => void;
  setRandomStep: (n: number) => void;
  setJournalView: (v: "cooked" | "log") => void;
  setJournalRating: (r: RatingFilter) => void;
  setJournalSort: (s: CookedSort) => void;
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
  kind: "all",
  randomStep: 0,
  journalView: "cooked",
  journalRating: "all",
  journalSort: "recent",
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
  setKind: (v) => set({ kind: v }),
  setRandomStep: (n) => set({ randomStep: n }),
  setJournalView: (v) => set({ journalView: v }),
  setJournalRating: (r) => set({ journalRating: r }),
  setJournalSort: (s) => set({ journalSort: s }),
  clear: () => set({ tags: [], glasses: [] }),
}));
