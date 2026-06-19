/**
 * Party planning — pure logic. Compose a set of N varieties for a number of people and
 * drinks-per-person, ranked so Chernivtsi-available cocktails come first.
 */
import type { Cocktail, CocktailTag } from "@/types/cocktail";
import { cocktailAvailability } from "@/data/catalog/availability";
import { recommendByMood } from "./cocktails";

export interface PartyConfig {
  people: number;
  varieties: number; // number of different cocktails
  drinksPerPerson: number;
  localOnly: boolean; // exclude cocktails needing rare (non-local) ingredients
}

export interface PartyItem {
  cocktail: Cocktail;
  servings: number;
}

export const MIN_PEOPLE = 2; // a set is for company — at least 2 people
export const DEFAULT_PARTY_CONFIG: PartyConfig = { people: 2, varieties: 3, drinksPerPerson: 2, localOnly: false };

/** Spread `total` servings across the picks as evenly as possible (min 1 each). */
export function distributeServings(picks: Cocktail[], total: number): PartyItem[] {
  const n = picks.length || 1;
  const base = Math.floor(total / n);
  const rem = total - base * n;
  return picks.map((c, i) => ({ cocktail: c, servings: Math.max(1, base + (i < rem ? 1 : 0)) }));
}

/** Auto-compose a party from the pool: optional mood, local-first ranking, even servings. */
export function composeParty(pool: Cocktail[], config: PartyConfig, moodTags: CocktailTag[] = []): PartyItem[] {
  let candidates = moodTags.length ? recommendByMood(pool, moodTags) : [...pool];
  if (candidates.length < config.varieties) candidates = [...pool];
  candidates.sort((a, b) => cocktailAvailability(a).score - cocktailAvailability(b).score);
  let chosen = config.localOnly ? candidates.filter((c) => cocktailAvailability(c).tier !== "rare") : candidates;
  if (chosen.length < config.varieties) chosen = candidates;
  const picks = chosen.slice(0, Math.max(1, config.varieties));
  const total = Math.max(picks.length, config.people * config.drinksPerPerson);
  return distributeServings(picks, total);
}

/** Build a plan from an explicit set of cocktails, scaled to the party size. */
export function planFromSet(cocktails: Cocktail[], config: PartyConfig): PartyItem[] {
  const total = Math.max(cocktails.length, config.people * config.drinksPerPerson);
  return distributeServings(cocktails, total);
}
