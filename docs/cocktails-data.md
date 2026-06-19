# Cocktails data — schema, conventions & pipeline

This is the reference for how cocktail recipes are stored and how the source photos are
turned into data + images. Read this before adding recipes or writing code that consumes them.

> **Historical note (2026-06):** the original deck photos (`init_pictures/`), the friend's raw
> data (`zagura_data/`), the `.work/` scratch dir, and the one-off extraction/translation
> scripts (`process-card`, `zagura-prep`, the `wf-*` workflows, …) have been **deleted**.
> `recipes/<n>-<slug>/` (recipe.json + front/back webp) is now the **sole source of truth**;
> re-cropping or re-transcribing from originals is no longer possible. The "Source photos" and
> photo-pipeline sections below are kept for provenance only — the **Data model** and **How to
> add a recipe** sections are still current.

## Source photos

The deck was photographed into `init_pictures/` — **238 HEIC photos**, `IMG_3083`–`IMG_3322`
(numbering has 2 gaps: `IMG_3164`, `IMG_3241` are missing).

Each cocktail is **two photos**:

- **front** — illustration, a number badge (e.g. `4`), the Ukrainian name, and the flavour
  tags line (`- міцні, кислі, … -`).
- **back** — the recipe: `ІНГРЕДІЄНТИ`, `ІНСТРУМЕНТИ`, `ПРИГОТУВАННЯ`.

Important quirks (these drive the pipeline design):

- **Pair by name, not by file order.** The back carries the _name_ but no number badge; the
  front carries _number + name_. Photos are not strictly front/back/front/back — e.g. the
  last photo (`IMG_3322`) is the back of a card whose front is mid-deck. Match front↔back on
  the cocktail name.
- **Orientation varies.** HEICs store rotation in the HEIF `irot` box (EXIF `orientation` is
  empty). The pipeline bakes this automatically; a few backs are still physically rotated and
  need an explicit `rotate90` (see below).
- **Background varies.** Most cards sit on light grey; some (e.g. `IMG_3322`) on dark. Auto
  card-detection assumes a dark card on a light background — dark-background shots need a
  manual crop (see Edge cases).

## Data model

Defined once in [`src/types/cocktail.ts`](../src/types/cocktail.ts) as **zod schemas**; the
TypeScript types are derived with `z.infer`. zod is the single source of truth so we get the
typed unions _and_ runtime validation of the hand-curated JSON.

| Field         | Type                | Notes                                                      |
| ------------- | ------------------- | ---------------------------------------------------------- |
| `id`          | `string`            | URL slug, unique. English cocktail name, e.g. `margarita`. |
| `cardNumber`  | `int`               | The number printed in the badge on the front.              |
| `name`        | `string`            | Ukrainian display name, e.g. `Маргарита`.                  |
| `nameEn`      | `string?`           | English name backing the slug.                             |
| `tags`        | `CocktailTag[]`     | Flavour/category tags, from a typed union.                 |
| `ingredients` | `Ingredient[]`      | `{ name, amount?, unit?, note? }`, printed order.          |
| `tools`       | `string[]`          | ІНСТРУМЕНТИ, printed order.                                |
| `steps`       | `string[]`          | ПРИГОТУВАННЯ, ordered.                                     |
| `glass`       | `string?`           | Glassware (usually the last tool).                         |
| `images`      | `{ front, back? }`  | webp filenames, relative to the recipe folder.             |
| `source`      | `{ front?, back? }` | Original HEIC filenames, for traceability.                 |

All user-facing text (`name`, `ingredients`, `tools`, `steps`) is stored **verbatim in
Ukrainian** as printed on the card. Only `id` / folder / image names are latinised.

### Tags & units are typed unions — extend as you go

`COCKTAIL_TAGS` and `UNITS` in `src/types/cocktail.ts` are `as const` arrays that back the
zod enums. When a card uses a tag or unit not yet in the list, **add it to the array** and
re-run `pnpm validate`. Current seeds: tags `міцні, кислі, цитрусові, солоні, тропічні`;
units `мл, г, шт, крапель, за смаком`.

## Storage layout

One folder per cocktail, named `<zero-padded cardNumber>-<slug>`:

```
recipes/
  004-margarita/
    recipe.json     # the data (validated against CocktailSchema)
    front.webp      # cropped front card, ~800px, deskewed, rounded corners
    back.webp       # cropped back, upright
  index.ts          # AUTO-GENERATED — typed `cocktails: Cocktail[]`
```

`recipes/index.ts` is generated; never edit it by hand. When the app framework is chosen,
the webp files are served from there (copied into / globbed from its static dir).

## Image pipeline

`sharp` can't decode HEIC, so [`scripts/process-card.ts`](../scripts/process-card.ts):

1. **Decode** with `sips -s format jpeg` (this re-emits the `irot` rotation as an EXIF tag),
   then sharp `.rotate()` auto-orients it upright. (Plain `sips → png` drops the rotation.)
2. **Detect** the card: downscale, estimate the background grey from the image corners, and
   find the bounding box of pixels much _darker_ than the background (this excludes the soft
   drop-shadow so the crop hugs the card).
3. **Deskew** the small tilt via PCA of the card mask (capped at 8° — a larger estimate means
   detection was confused, so it's skipped).
4. **Crop** tight, resize to 800px wide, **mask the rounded corners** (so the corner
   triangles are transparent), and write `.webp`.

### `scripts/crops.json`

Per-card config keyed by card number:

```jsonc
{
  "4": {
    "slug": "margarita",
    "front": { "source": "IMG_3083.HEIC", "rotate90": 0 },
    "back": { "source": "IMG_3084.HEIC", "rotate90": 0 },
  },
}
```

- `rotate90` — extra 90° clockwise turns applied _after_ auto-orient. Usually `0`; set `1`/`2`/`3`
  for the odd physically-rotated back.
- `rect` (optional) `{ left, top, width, height }` + `angle` (optional) — **manual override**
  in full-resolution post-rotation pixels; bypasses auto-detection. Use for low-contrast /
  dark-background shots where detection fails.

## Adding a recipe

1. Look at the front and back photos; read the recipe.
2. Add an entry to `scripts/crops.json` (slug + source files; `rotate90`/`rect` if needed).
3. `pnpm process:card <cardNumber>` → writes `front.webp` / `back.webp` into the folder.
   Eyeball the output; tweak `rotate90` / add a manual `rect` and re-run if it's off.
4. Write `recipes/<n>-<slug>/recipe.json` (transcribe verbatim; extend the tag/unit unions if
   needed). When a reading is ambiguous, cross-check the recipe online.
5. `pnpm validate` (schema + uniqueness + image files exist), then `pnpm gen:index`.

## Scripts

| Command                         | Does                                             |
| ------------------------------- | ------------------------------------------------ |
| `pnpm process:card <n> [<n> …]` | Crop front/back webp for card(s) `n`.            |
| `pnpm validate`                 | Validate every `recipe.json` against the schema. |
| `pnpm gen:index`                | Regenerate `recipes/index.ts`.                   |

## Edge cases

- **Dark-background photos** (e.g. `IMG_3322`): dark-on-light detection fails — supply a
  manual `rect` in `crops.json`.
- **Rotated backs**: set `rotate90`.
- **To-taste ingredients**: omit `amount`/`unit`, use `note: "за смаком"`.
