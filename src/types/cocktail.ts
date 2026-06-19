import { z } from "zod";

/**
 * Single source of truth for the cocktail data model.
 *
 * zod schemas are authoritative; the TypeScript types are derived from them with
 * `z.infer`. This gives us BOTH a typed union (compile time) and runtime validation
 * of the hand-curated JSON in `recipes/<n>-<slug>/recipe.json` (run `pnpm validate`).
 *
 * Everything user-facing is Ukrainian — names, ingredients, tools and steps are stored
 * verbatim as printed on the physical cards. Only `id`/folder slugs are latinised.
 */

/** Units of measure, exactly as printed on the cards. Extend as new ones appear. */
export const UNITS = ["мл", "л", "г", "шт", "крапель", "за смаком"] as const;
export const UnitSchema = z.enum(UNITS);
export type Unit = z.infer<typeof UnitSchema>;

/**
 * Flavour / category tags printed under the cocktail name (the "- міцні, кислі … -" line).
 * This list grows as the deck is processed; add new tags here and re-run `pnpm validate`.
 */
export const COCKTAIL_TAGS = [
  // strength
  "міцні",
  "слабоалкогольні",
  "безалкогольні",
  // taste / flavour
  "кислі",
  "солодкі",
  "солоні",
  "гіркі",
  "сухі",
  "пряні",
  "пікантні",
  "цитрусові",
  "фруктові",
  "ягідні",
  "тропічні",
  "трав'яні", // herbal (OCR variants трав'янисті/трав'яністі were normalized to this)
  "м'ятні",
  "квіткові",
  "овочеві",
  "зелені",
  "вершкові",
  "мигдалеві",
  "кавові",
  "шоколадні",
  // colour / appearance
  "бежеві",
  "коричневі",
  "прозорі",
  // family / style
  "класичні",
  "десерти",
  "театр",
  "твісти",
  "лонги",
  "шорти",
  "шоти",
  "колінзи",
  "фізи",
  "сауери",
  "мартіні",
  // base
  "на горілці",
  "на джині",
  "на ромі",
  "на текілі",
  "на віскі",
  "на бурбоні",
  "на вермуті",
  "на вині",
  "на ігристому",
  "на мескалю",
  "на піско",
  "на соку",
  "на газованій воді",
] as const;
export const CocktailTagSchema = z.enum(COCKTAIL_TAGS);
export type CocktailTag = z.infer<typeof CocktailTagSchema>;

/** One ingredient row from the ІНГРЕДІЄНТИ section. */
export const IngredientSchema = z.object({
  /** Full name as printed, e.g. "Срібна текіла Sauza". */
  name: z.string(),
  /** Numeric quantity. Omitted for to-taste / unmeasured items. */
  amount: z.number().optional(),
  /** Unit of measure. Omitted together with `amount` for to-taste items. */
  unit: UnitSchema.optional(),
  /** Free-text qualifier when there is no clean amount+unit, e.g. "за смаком". */
  note: z.string().optional(),
});
export type Ingredient = z.infer<typeof IngredientSchema>;

/** A full cocktail recipe = one card (front + back). */
export const CocktailSchema = z.object({
  /** URL-safe latin slug, unique. English cocktail name where one exists, e.g. "margarita". */
  id: z.string(),
  /** Number printed in the badge on the card front. */
  cardNumber: z.number().int(),
  /** Ukrainian display name, e.g. "Маргарита". */
  name: z.string(),
  /** English name backing the slug, e.g. "Margarita". Optional for cards with no obvious one. */
  nameEn: z.string().optional(),
  /** Flavour/category tags printed under the name. */
  tags: z.array(CocktailTagSchema),
  /** Ingredients in printed order. */
  ingredients: z.array(IngredientSchema),
  /** Bar tools & glassware (ІНСТРУМЕНТИ), in printed order. */
  tools: z.array(z.string()),
  /** Preparation steps (ПРИГОТУВАННЯ), in order. */
  steps: z.array(z.string()),
  /** Glassware (usually the last tool). Convenience field for display/filtering. */
  glass: z.string().optional(),
  /** Cropped webp filenames, relative to the recipe folder. Absent for imported recipes. */
  images: z.object({
    front: z.string().optional(),
    back: z.string().optional(),
  }),
  /** Original source photos for traceability. */
  source: z.object({
    front: z.string().optional(),
    back: z.string().optional(),
  }),
});
export type Cocktail = z.infer<typeof CocktailSchema>;
