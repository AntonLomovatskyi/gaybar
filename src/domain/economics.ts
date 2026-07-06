/**
 * Rough cost (₴) and calories per ingredient / cocktail. Values are MEDIUM Ukrainian retail
 * prices (researched Jul 2026) expressed per 100 ml (liquids) or 100 g (solids), by ingredient
 * category, with a few per-item overrides. Everything here is an estimate — always shown with "≈".
 *
 * Anchors used: spirits ~350–700 ₴/0.7 л, Aperol 489 ₴/0.7 л, Campari 464 ₴/0.5 л,
 * Martini 399 ₴/1 л, Monin syrup ~650 ₴/1 л, Schweppes 48 ₴/1 л, Angostura 1355 ₴/0.2 л.
 */
import type { Cocktail, Ingredient } from "@/types/cocktail";
import { categoryGroupOf } from "@/data/catalog/ingredients";
import { normalize } from "./text";

// ₴ per 100 ml / 100 g, by ingredient category group.
const COST_BY_GROUP: Record<string, number> = {
  Алкоголь: 65,
  Лікери: 85,
  "Вино та вермут": 40,
  Бітери: 550,
  Пиво: 9,
  "Фрукти та ягоди": 12,
  Трави: 25,
  Спеції: 25,
  "Молочне та яйця": 14,
  Соки: 6,
  Сиропи: 45,
  Прикраси: 6,
  Напої: 5,
  Інше: 8,
};

// kcal per 100 ml / 100 g, by ingredient category group.
const CAL_BY_GROUP: Record<string, number> = {
  Алкоголь: 220,
  Лікери: 300,
  "Вино та вермут": 140,
  Бітери: 280,
  Пиво: 43,
  "Фрукти та ягоди": 50,
  Трави: 30,
  Спеції: 250,
  "Молочне та яйця": 90,
  Соки: 45,
  Сиропи: 260,
  Прикраси: 30,
  Напої: 38,
  Інше: 40,
};

// Per-item overrides, matched on a normalized-name substring. Later matches win.
const OVERRIDES: { match: string; cost?: number; cal?: number }[] = [
  { match: "лід", cost: 0, cal: 0 },
  { match: "вода", cost: 0, cal: 0 },
  { match: "содова", cost: 3, cal: 0 },
  { match: "цукор", cost: 4, cal: 400 },
  { match: "сіль", cost: 2, cal: 0 },
  { match: "мед", cost: 35, cal: 304 },
  { match: "вершки", cost: 20, cal: 340 },
  { match: "молоко", cost: 4, cal: 60 },
  { match: "яєчн", cost: 9, cal: 47 }, // egg white
  { match: "яйце", cost: 9, cal: 143 },
  { match: "кола", cal: 42 },
  { match: "текіла", cost: 100 },
  { match: "віскі", cost: 85 },
  { match: "коньяк", cost: 95 },
  { match: "бренді", cost: 80 },
  { match: "шампан", cost: 60 },
  { match: "просекко", cost: 45 },
  { match: "ігрист", cost: 40 },
];

function per100(name: string): { cost: number; cal: number } {
  const n = normalize(name);
  const group = categoryGroupOf(name);
  let cost = COST_BY_GROUP[group] ?? COST_BY_GROUP.Інше;
  let cal = CAL_BY_GROUP[group] ?? CAL_BY_GROUP.Інше;
  for (const o of OVERRIDES) {
    if (!n.includes(o.match)) continue;
    if (o.cost !== undefined) cost = o.cost;
    if (o.cal !== undefined) cal = o.cal;
  }
  return { cost, cal };
}

/** How many "100-unit" portions the amount represents (ml/g → /100; шт ≈ 50 g; drops ≈ 0). */
function fraction(ing: Ingredient): number {
  const a = ing.amount ?? 0;
  if (!a) return 0;
  switch (ing.unit) {
    case "мл":
    case "г":
      return a / 100;
    case "шт":
      return (a * 50) / 100; // ~50 g/ml per piece (egg, citrus wedge)
    case "крапель":
      return (a * 0.05) / 100; // a drop ≈ 0.05 ml
    default:
      return 0; // "за смаком" / unspecified
  }
}

export function ingredientCost(ing: Ingredient): number {
  return per100(ing.name).cost * fraction(ing);
}
export function ingredientCalories(ing: Ingredient): number {
  return per100(ing.name).cal * fraction(ing);
}
export function costPer100(name: string): number {
  return per100(name).cost;
}
export function caloriesPer100(name: string): number {
  return per100(name).cal;
}

// Typical pack size sold at retail, by category, for a "whole item" price estimate.
const PACK_BY_GROUP: Record<string, { size: number; label: string }> = {
  Алкоголь: { size: 700, label: "0.7 л" },
  Лікери: { size: 700, label: "0.7 л" },
  "Вино та вермут": { size: 1000, label: "1 л" },
  Бітери: { size: 200, label: "0.2 л" },
  Пиво: { size: 500, label: "0.5 л" },
  Соки: { size: 1000, label: "1 л" },
  Сиропи: { size: 1000, label: "1 л" },
  Напої: { size: 1000, label: "1 л" },
  "Молочне та яйця": { size: 500, label: "0.5 л" },
  "Фрукти та ягоди": { size: 1000, label: "1 кг" },
  Трави: { size: 100, label: "100 г" },
  Спеції: { size: 100, label: "100 г" },
  Прикраси: { size: 100, label: "100 г" },
  Інше: { size: 100, label: "100 мл" },
};

/** Estimated price of a whole retail item (a bottle / pack), with its size label. */
export function wholeItemPrice(name: string): { cost: number; label: string } {
  const p = PACK_BY_GROUP[categoryGroupOf(name)] ?? PACK_BY_GROUP.Інше;
  return { cost: Math.round(costPer100(name) * (p.size / 100)), label: p.label };
}

export function cocktailCost(c: Cocktail, servings = 1): number {
  return Math.round(c.ingredients.reduce((sum, ing) => sum + ingredientCost(ing), 0) * servings);
}
export function cocktailCalories(c: Cocktail, servings = 1): number {
  return Math.round(c.ingredients.reduce((sum, ing) => sum + ingredientCalories(ing), 0) * servings);
}
