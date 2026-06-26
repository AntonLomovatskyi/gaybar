/**
 * Canonical-ingredient lookups, backed by the reviewed catalog (ingredients.generated.ts).
 * This is the seam the matcher + availability use: canonical id (exact match), family
 * (substitution), and Chernivtsi availability. Falls back to the family heuristic for any
 * name not in the catalog.
 */
import { normalize } from "@/domain/text";
import { resolveFamily as heuristicFamily } from "./families";
import { CANONICAL, NORM_TO_ID, RAW_TO_ID, type Availability, type CanonicalIngredient } from "./ingredients.generated";

export type { Availability, CanonicalIngredient };

function refOf(name: string): CanonicalIngredient | undefined {
  const id = RAW_TO_ID[name] ?? NORM_TO_ID[normalize(name)];
  return id ? CANONICAL[id] : undefined;
}

/** Stable canonical id for exact matching; falls back to the normalized name. */
export function canonicalIdOf(name: string): string {
  return RAW_TO_ID[name] ?? NORM_TO_ID[normalize(name)] ?? normalize(name);
}

/** Base family for substitution (rum/gin/…); null for non-spirits. Heuristic fallback. */
export function familyOf(name: string): string | null {
  const r = refOf(name);
  if (r) return r.family;
  const h = heuristicFamily(name);
  return h === normalize(name) ? null : h;
}

/** Chernivtsi availability; unknown names assumed common. */
export function availabilityOf(name: string): Availability {
  return refOf(name)?.availability ?? "common";
}

export function isPantryStaple(name: string): boolean {
  return refOf(name)?.isPantryStaple ?? false;
}

/** Categories we treat as "alcohol" — the only ingredients that gate what you can make. */
export const ALCOHOLIC_CATEGORIES = new Set(["spirit", "liqueur", "wine", "bitters", "beer"]);
/** Families that imply alcohol when a name isn't in the catalog (heuristic fallback). */
const ALCOHOLIC_FAMILIES = new Set([
  "vodka",
  "gin",
  "rum",
  "tequila",
  "whisky",
  "mezcal",
  "pisco",
  "brandy",
  "cachaca",
  "vermouth",
  "wine",
  "sparkling",
]);

/** Catalog category for a raw name, or null if unknown. */
export function categoryOf(name: string): string | null {
  return refOf(name)?.category ?? null;
}

/** Canonical display name (folds variants); falls back to the raw name. */
export function canonicalNameOf(name: string): string {
  return refOf(name)?.nameUk ?? name;
}

/** True if this ingredient is alcoholic (spirit/liqueur/wine/bitters) — the bar-essential set. */
export function isAlcoholic(name: string): boolean {
  const cat = categoryOf(name);
  if (cat) return ALCOHOLIC_CATEGORIES.has(cat);
  const fam = familyOf(name);
  return fam != null && ALCOHOLIC_FAMILIES.has(fam);
}

/** Every distinct alcoholic canonical ingredient (for the bar picker + setup stepper). */
export function alcoholicCanonicals(): CanonicalIngredient[] {
  return Object.values(CANONICAL)
    .filter((c) => ALCOHOLIC_CATEGORIES.has(c.category))
    .sort((a, b) => a.nameUk.localeCompare(b.nameUk, "uk"));
}

/** Always-on-hand: ice + anything flagged a pantry staple. Never gates "can I make". */
function isAssumed(c: CanonicalIngredient): boolean {
  return c.category === "ice" || c.isPantryStaple;
}

/** Fresh / perishable non-alcohol worth tracking (fruit, herbs, spices, dairy, eggs, special juices/syrups). */
export function freshCanonicals(): CanonicalIngredient[] {
  return Object.values(CANONICAL)
    .filter((c) => !ALCOHOLIC_CATEGORIES.has(c.category) && !isAssumed(c))
    .sort((a, b) => a.nameUk.localeCompare(b.nameUk, "uk"));
}

/** Everything worth tracking in the bar = alcohol + fresh (excludes pantry staples). */
export function trackableCanonicals(): CanonicalIngredient[] {
  return Object.values(CANONICAL)
    .filter((c) => ALCOHOLIC_CATEGORIES.has(c.category) || !isAssumed(c))
    .sort((a, b) => a.nameUk.localeCompare(b.nameUk, "uk"));
}

/** Display group for an owned ingredient (for the grouped bar list). */
const CATEGORY_GROUP: Record<string, string> = {
  spirit: "Алкоголь",
  liqueur: "Лікери",
  wine: "Вино та вермут",
  bitters: "Бітери",
  beer: "Пиво",
  fruit: "Фрукти та ягоди",
  herb: "Трави",
  spice: "Спеції",
  dairy: "Молочне та яйця",
  egg: "Молочне та яйця",
  juice: "Соки",
  syrup: "Сиропи",
  garnish: "Прикраси",
  mixer: "Напої",
  pantry: "Інше",
  other: "Інше",
  ice: "Інше",
};
export function categoryGroupOf(name: string): string {
  return CATEGORY_GROUP[categoryOf(name) ?? "other"] ?? "Інше";
}
