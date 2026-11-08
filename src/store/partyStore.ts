/** Current party plan (transient — the composed/selected set the plan + stepper screens read). */
import { create } from "zustand";
import { DEFAULT_PARTY_CONFIG, type PartyConfig } from "@/domain/party";

export interface PlanItem {
  id: string; // cocktail id
  servings: number;
}

interface PartyStore {
  config: PartyConfig;
  title: string;
  items: PlanItem[];
  /** What the generator couldn't honour (e.g. a must-use product nothing contains), shown on the plan. */
  notice: string | null;
  setConfig: (c: Partial<PartyConfig>) => void;
  setPlan: (items: PlanItem[], title: string, notice?: string | null) => void;
  bumpServings: (id: string, delta: number) => void;
}

export const usePartyStore = create<PartyStore>((set) => ({
  config: DEFAULT_PARTY_CONFIG,
  title: "",
  items: [],
  notice: null,
  setConfig: (c) => set((s) => ({ config: { ...s.config, ...c } })),
  setPlan: (items, title, notice = null) => set({ items, title, notice }),
  bumpServings: (id, delta) =>
    set((s) => ({
      items: s.items.map((it) => (it.id === id ? { ...it, servings: Math.max(1, it.servings + delta) } : it)),
    })),
}));
