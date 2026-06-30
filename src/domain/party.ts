/**
 * Party planning — pure logic. Compose a set of N varieties for a number of people, preferring
 * cocktails you can make from your bar, with even servings.
 */
import type { Cocktail, CocktailTag } from "@/types/cocktail";
import { recommendByMood } from "./cocktails";
import { whatCanIMake } from "./inventory";

export interface PartyConfig {
  people: number;
  varieties: number; // number of different cocktails
  drinksPerPerson: number;
  useMyBar: boolean; // prefer cocktails makeable from the ingredients you already own
  everyoneTries: boolean; // make enough of EACH variety for everyone to try it
}

export interface PartyItem {
  cocktail: Cocktail;
  servings: number;
}

export const MIN_PEOPLE = 2; // a set is for company — at least 2 people
export const DEFAULT_PARTY_CONFIG: PartyConfig = {
  people: 2,
  varieties: 3,
  drinksPerPerson: 2,
  useMyBar: false,
  everyoneTries: true,
};

/** Spread `total` servings across the picks as evenly as possible (min 1 each). */
export function distributeServings(picks: Cocktail[], total: number): PartyItem[] {
  const n = picks.length || 1;
  const base = Math.floor(total / n);
  const rem = total - base * n;
  return picks.map((c, i) => ({ cocktail: c, servings: Math.max(1, base + (i < rem ? 1 : 0)) }));
}

/**
 * Servings per pick. With `everyoneTries`, make `people` of EACH variety (min 2) so everyone
 * can taste every cocktail; otherwise spread people×drinksPerPerson evenly across the picks.
 */
function planServings(picks: Cocktail[], config: PartyConfig): PartyItem[] {
  if (config.everyoneTries) {
    const per = Math.max(config.people, MIN_PEOPLE);
    return picks.map((c) => ({ cocktail: c, servings: per }));
  }
  return distributeServings(picks, Math.max(picks.length, config.people * config.drinksPerPerson));
}

/** Auto-compose a party from the pool: optional mood, local-first ranking, even servings. */
export function composeParty(
  pool: Cocktail[],
  config: PartyConfig,
  moodTags: CocktailTag[] = [],
  owned: string[] = [],
): PartyItem[] {
  const candidates = moodTags.length ? recommendByMood(pool, moodTags) : [...pool];
  let chosen = candidates.length >= config.varieties ? candidates : [...pool];
  // Prioritize cocktails you can make from your bar. Always soft-prefer them; when "useMyBar"
  // is on, restrict to only-makeable (unless that leaves too few to fill the set).
  if (owned.length) {
    const makeable = new Set(whatCanIMake(chosen, owned, true).makeable.map((m) => m.cocktail.id));
    const yes = chosen.filter((c) => makeable.has(c.id));
    const no = chosen.filter((c) => !makeable.has(c.id));
    chosen = config.useMyBar && yes.length >= config.varieties ? yes : [...yes, ...no];
  }
  const picks = chosen.slice(0, Math.max(1, config.varieties));
  return planServings(picks, config);
}

/** Build a plan from an explicit set of cocktails, scaled to the party size. */
export function planFromSet(cocktails: Cocktail[], config: PartyConfig): PartyItem[] {
  return planServings(cocktails, config);
}
