/**
 * Pure cocktail domain logic — data in / data out, no React, storage, or data-source imports.
 * These functions are unit-testable today and liftable into a future Node backend unchanged.
 */
import type { Cocktail, CocktailTag, Ingredient } from "@/types/cocktail";
import { TAG_TO_GROUP, strengthOf, type TagGroupKey } from "@/data/catalog/taxonomy";
import { familyOf } from "@/data/catalog/ingredients";
import { toolInfo } from "@/data/catalog/tools";
import { compareUk, normalize } from "./text";

/** Map an ingredient base family to the matching base tag. */
const FAMILY_TO_BASE: Record<string, CocktailTag> = {
  vodka: "на горілці",
  gin: "на джині",
  rum: "на ромі",
  tequila: "на текілі",
  whisky: "на віскі",
  mezcal: "на мескалю",
  pisco: "на піско",
  vermouth: "на вермуті",
  wine: "на вині",
  sparkling: "на ігристому",
};

/** Derive the base spirit tag from the lead spirit ingredient (for cocktails without a base tag). */
export function baseSpiritOf(c: Cocktail): CocktailTag | null {
  for (const ing of c.ingredients) {
    const f = familyOf(ing.name);
    if (f && FAMILY_TO_BASE[f]) return FAMILY_TO_BASE[f];
  }
  return null;
}

/** Canonical glass for a cocktail (from its `glass` field, else its first glass-type tool). */
export function glassOf(c: Cocktail): { id: string; nameUk: string } | null {
  const raw = c.glass ?? c.tools.find((tl) => toolInfo(tl).kind === "glass");
  if (!raw) return null;
  const info = toolInfo(raw);
  return info.kind === "glass" ? { id: info.id, nameUk: info.nameUk } : null;
}

export interface CocktailFilter {
  /** Selected tags. AND across axes (strength/taste/base/…), OR within an axis. */
  tags?: CocktailTag[];
  /** Selected canonical glass ids (OR within the glass axis). */
  glasses?: string[];
  /** Free-text query over name / nameEn / cardNumber / ingredient names. */
  query?: string;
}

export type SortMode = "card" | "name" | "strength" | "ingredients";

export function search(cocktails: Cocktail[], query: string): Cocktail[] {
  const q = normalize(query);
  if (!q) return cocktails;
  const terms = q.split(" ");
  return cocktails.filter((c) => {
    const hay = normalize(
      [c.name, c.nameEn ?? "", String(c.cardNumber), ...c.ingredients.map((i) => i.name), ...c.tags].join(" "),
    );
    return terms.every((t) => hay.includes(t));
  });
}

export function applyFilters(cocktails: Cocktail[], filter: CocktailFilter): Cocktail[] {
  let out = cocktails;
  if (filter.query) out = search(out, filter.query);
  if (filter.glasses && filter.glasses.length) {
    const wanted = new Set(filter.glasses);
    out = out.filter((c) => {
      const g = glassOf(c);
      return g ? wanted.has(g.id) : false;
    });
  }
  if (filter.tags && filter.tags.length) {
    // group selected tags by axis
    const byAxis = new Map<TagGroupKey, Set<string>>();
    for (const t of filter.tags) {
      const axis = TAG_TO_GROUP[t];
      if (!axis) continue;
      if (!byAxis.has(axis)) byAxis.set(axis, new Set());
      byAxis.get(axis)!.add(t);
    }
    out = out.filter((c) => {
      const tagset = new Set<string>(c.tags);
      const base = baseSpiritOf(c); // so base filtering works even without an explicit base tag
      if (base) tagset.add(base);
      for (const [, wanted] of byAxis) {
        let hit = false;
        for (const w of wanted)
          if (tagset.has(w)) {
            hit = true;
            break;
          }
        if (!hit) return false; // axis required but none matched
      }
      return true;
    });
  }
  return out;
}

export function sortBy(cocktails: Cocktail[], mode: SortMode): Cocktail[] {
  const arr = [...cocktails];
  switch (mode) {
    case "name":
      return arr.sort((a, b) => compareUk(a.name, b.name));
    case "strength":
      return arr.sort((a, b) => strengthOf(a.tags) - strengthOf(b.tags) || compareUk(a.name, b.name));
    case "ingredients":
      return arr.sort((a, b) => a.ingredients.length - b.ingredients.length || compareUk(a.name, b.name));
    case "card":
    default:
      return arr.sort((a, b) => a.cardNumber - b.cardNumber);
  }
}

export function recommendByMood(cocktails: Cocktail[], moodTags: CocktailTag[]): Cocktail[] {
  const want = new Set<string>(moodTags);
  return cocktails
    .map((c) => ({ c, score: c.tags.filter((t) => want.has(t)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || compareUk(a.c.name, b.c.name))
    .map((x) => x.c);
}

/** Deterministic "surprise me" pick that varies with the provided seed (e.g. Date passed by UI). */
export function pickSurprise(cocktails: Cocktail[], seed: number): Cocktail | null {
  if (!cocktails.length) return null;
  return cocktails[Math.abs(Math.floor(seed)) % cocktails.length];
}

const fmtAmount = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10));
const OZ_ML = 29.5735;

export type UnitSystem = "ml" | "oz";

/** Format a quantity, converting мл→oz when the oz unit system is selected. */
export function formatQty(amount: number | undefined, unit: string | undefined, units: UnitSystem = "ml"): string {
  if (unit === "за смаком") return "за смаком"; // to-taste: never show a number
  if (amount == null) return unit ?? "";
  if (units === "oz" && unit === "мл") return `${Math.round((amount / OZ_ML) * 4) / 4} oz`;
  return `${fmtAmount(amount)} ${unit ?? ""}`.trim();
}

/** Format an ingredient line, optionally scaled by `factor` and converted to the unit system. */
export function formatIngredient(i: Ingredient, factor = 1, units: UnitSystem = "ml"): string {
  if (i.unit === "за смаком") return `${i.name} — ${i.note ?? "за смаком"}`; // ignore amount (e.g. "0")
  if (i.amount != null && i.amount !== 0) return `${i.name} — ${formatQty(i.amount * factor, i.unit, units)}`;
  if (i.note) return `${i.name} — ${i.note}`;
  return i.name;
}

export interface StepProgress {
  current: number;
  total: number;
  pct: number;
}
export function stepProgress(total: number, index: number): StepProgress {
  const current = Math.min(index + 1, total);
  return { current, total, pct: total ? current / total : 0 };
}
