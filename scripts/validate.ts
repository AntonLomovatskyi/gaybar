/**
 * Validate every recipe against the schema:  pnpm validate
 *
 * Parses each recipes/<n>-<slug>/recipe.json with CocktailSchema, and checks that ids and
 * card numbers are unique and that the referenced image files exist. Exits non-zero on any
 * problem, so it can gate a build / CI.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CocktailSchema } from "../src/types/cocktail.js";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const RECIPES_DIR = join(ROOT, "recipes");

const folders = readdirSync(RECIPES_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const errors: string[] = [];
const ids = new Set<string>();
const numbers = new Set<number>();

for (const folder of folders) {
  const dir = join(RECIPES_DIR, folder);
  const file = join(dir, "recipe.json");
  if (!existsSync(file)) {
    errors.push(`${folder}: missing recipe.json`);
    continue;
  }
  const parsed = CocktailSchema.safeParse(JSON.parse(readFileSync(file, "utf8")));
  if (!parsed.success) {
    errors.push(`${folder}: ${JSON.stringify(parsed.error.issues)}`);
    continue;
  }
  const c = parsed.data;
  if (ids.has(c.id)) errors.push(`${folder}: duplicate id "${c.id}"`);
  if (numbers.has(c.cardNumber)) errors.push(`${folder}: duplicate cardNumber ${c.cardNumber}`);
  ids.add(c.id);
  numbers.add(c.cardNumber);
  if (c.images.front && !existsSync(join(dir, c.images.front))) errors.push(`${folder}: missing ${c.images.front}`);
  if (c.images.back && !existsSync(join(dir, c.images.back))) {
    errors.push(`${folder}: missing ${c.images.back}`);
  }
}

if (errors.length) {
  console.error(`✗ ${errors.length} problem(s):`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log(`✓ ${folders.length} recipe(s) valid`);
