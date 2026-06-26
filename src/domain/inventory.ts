/**
 * "What can I make from what I have" — substitution-aware. Pure logic.
 *
 * Flexible matching (default): a generic you own satisfies a specific variant a recipe asks
 * for, via ingredient families (e.g. own "ром" → can make something needing "білий ром",
 * marked as a substitute). Strict matching requires the same ingredient.
 *
 * Matching goes through `resolveFamily()` + name normalization; both are swapped for the
 * curated canonical dictionary later without changing this file's callers.
 */
import type { Cocktail, Ingredient } from "@/types/cocktail";
import { canonicalIdOf, familyOf, isAlcoholic, isAssumedAvailable } from "@/data/catalog/ingredients";
import { toolInfo } from "@/data/catalog/tools";
import { normalize } from "./text";

/** Ingredients that don't count toward "can I make it" (ice, and optional/garnish items). */
export function isIgnorable(i: Ingredient): boolean {
  const n = normalize(i.name);
  if (n.includes("лід")) return true; // ice — assume always available
  if (i.note && /бажанн|смаком/.test(i.note)) return true; // "за бажанням" / "за смаком"
  return false;
}

/**
 * What gates "can I make it": alcohol AND fresh/perishable ingredients (fruit, berries, herbs,
 * spices, dairy, eggs, special juices/syrups). Only true pantry staples — ice, water, sugar,
 * simple syrup, salt, common citrus juice, cola, milk, honey — are assumed always on-hand.
 */
export function isEssential(i: Ingredient): boolean {
  if (isIgnorable(i)) return false;
  if (isAlcoholic(i.name)) return true;
  return !isAssumedAvailable(i.name); // pantry staples, ice & garnishes never block
}

export type MatchTier = "exact" | "substitute" | "missing";

/**
 * Classify one required ingredient against the owned list using canonical ids (exact) and
 * families (substitute, e.g. own white rum → can stand in for a recipe's gold rum).
 */
export function classifyIngredient(
  required: Ingredient,
  owned: string[],
  flexible: boolean,
): { tier: MatchTier; have?: string } {
  const rid = canonicalIdOf(required.name);
  const rfam = familyOf(required.name);
  let substitute: string | undefined;
  for (const o of owned) {
    if (canonicalIdOf(o) === rid) return { tier: "exact", have: o };
    if (rfam && familyOf(o) === rfam) substitute ??= o; // same base family
  }
  if (substitute && flexible) return { tier: "substitute", have: substitute };
  return { tier: "missing" };
}

export interface Substitution {
  required: Ingredient;
  have: string;
}
export interface MakeResult {
  cocktail: Cocktail;
  missing: Ingredient[];
  substitutions: Substitution[];
}

export function whatCanIMake(cocktails: Cocktail[], owned: string[], flexible = true) {
  const makeable: MakeResult[] = [];
  const almost: MakeResult[] = [];
  for (const c of cocktails) {
    const required = c.ingredients.filter(isEssential);
    const missing: Ingredient[] = [];
    const substitutions: Substitution[] = [];
    for (const ing of required) {
      const { tier, have } = classifyIngredient(ing, owned, flexible);
      if (tier === "missing") missing.push(ing);
      else if (tier === "substitute" && have) substitutions.push({ required: ing, have });
    }
    const result: MakeResult = { cocktail: c, missing, substitutions };
    const have = required.length - missing.length;
    if (missing.length === 0) makeable.push(result);
    // "almost" only if you genuinely already own most of it — at least as many as you're
    // missing. Otherwise a 2-ingredient drink you're missing both of looks "almost" (noise).
    else if (missing.length <= 2 && have >= missing.length) almost.push(result);
  }
  // makeable: exact-only first, then those relying on substitutes; almost: fewest missing first
  makeable.sort((a, b) => a.substitutions.length - b.substitutions.length);
  almost.sort((a, b) => a.missing.length - b.missing.length || a.substitutions.length - b.substitutions.length);
  return { makeable, almost };
}

export interface PurchaseSuggestion {
  name: string; // display name of the ingredient to buy
  canonicalId: string;
  cocktails: Cocktail[]; // cocktails that become makeable if you buy it
}

/**
 * Ingredients that unlock the most cocktails: for each cocktail you're a single ingredient
 * short of, that one ingredient unlocks it. Grouped by canonical id, ranked by unlock count.
 */
export function suggestPurchases(cocktails: Cocktail[], owned: string[], flexible = true): PurchaseSuggestion[] {
  const byId = new Map<string, PurchaseSuggestion>();
  for (const c of cocktails) {
    const required = c.ingredients.filter(isEssential);
    const missing = required.filter((i) => classifyIngredient(i, owned, flexible).tier === "missing");
    if (missing.length !== 1) continue; // exactly one ingredient away
    const ing = missing[0];
    const id = canonicalIdOf(ing.name);
    let s = byId.get(id);
    if (!s) {
      s = { name: ing.name, canonicalId: id, cocktails: [] };
      byId.set(id, s);
    }
    s.cocktails.push(c);
  }
  return [...byId.values()].sort((a, b) => b.cocktails.length - a.cocktails.length);
}

/** True if every (non-glass) tool a cocktail needs is in the owned set (by canonical tool id). */
export function hasAllTools(cocktail: Cocktail, ownedTools: string[]): boolean {
  const ownedIds = new Set(ownedTools.map((t) => toolInfo(t).id));
  return cocktail.tools.every((t) => {
    const info = toolInfo(t);
    return info.kind === "glass" || ownedIds.has(info.id);
  });
}
