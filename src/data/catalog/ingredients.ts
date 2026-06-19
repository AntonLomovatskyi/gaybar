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
