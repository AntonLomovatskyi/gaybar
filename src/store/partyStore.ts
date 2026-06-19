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
  setConfig: (c: Partial<PartyConfig>) => void;
  setPlan: (items: PlanItem[], title: string) => void;
  bumpServings: (id: string, delta: number) => void;
}

export const usePartyStore = create<PartyStore>((set) => ({
  config: DEFAULT_PARTY_CONFIG,
  title: "",
  items: [],
  setConfig: (c) => set((s) => ({ config: { ...s.config, ...c } })),
  setPlan: (items, title) => set({ items, title }),
  bumpServings: (id, delta) =>
    set((s) => ({
      items: s.items.map((it) => (it.id === id ? { ...it, servings: Math.max(1, it.servings + delta) } : it)),
    })),
}));
