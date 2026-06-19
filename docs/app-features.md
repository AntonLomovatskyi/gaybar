# Implementation Plan — gaybar (on-device cocktail app)

## 0. Decisions (locked 2026-06-19)

- **Scope:** "everything reasonable" — build all frontend-only features (MVP + v2 of the roadmap below) in one effort.
- **Canonical dictionary:** I generate a draft (LLM-assisted), user reviews/corrects.
- **Tool images (#12):** ship placeholders now, drop in real photos later.
- **AI features DROPPED:** no photo-of-bottles inventory, no free-text NL mood search. Remove `VisionService`/`LLMService` and the user-key flow from scope. My Bar inventory is **manual entry via Ukrainian autocomplete**. (Add-recipe photos remain — they're plain image-picker file URIs, not AI.)
- Deployment primary channel: web PWA (assumed; revisit if needed). Real cross-device auth/sync remains "Later / needs-backend".

## 1. Overview

We are building **gaybar**: an Expo (React Native) app that turns a physical 119-card cocktail deck into an interactive, **fully offline, Ukrainian-language** app. It does discovery (browse / search / filter / mood), full recipes with a guided step-by-step "cooking mode", a personal bar inventory with "what can I make tonight", a scaled shopping list, favourites/ratings, and user-added recipes.

**Stance: on-device now, backend-later.** There is **no backend server today**. All recipe data ships bundled in the app; all user state lives on-device. But the codebase is built around a **repository/service interface seam** and **pure, data-source-agnostic domain functions**, so that swapping a `LocalCocktailRepository` for an `HttpCocktailRepository` later is a one-file change and never touches a screen or a domain function. Recommendations, inventory matching, and shopping-list math are written as pure functions that can literally be lifted into a future Node package and run server-side unchanged.

**LLM posture:** any Claude feature (photo-of-bottles inventory, free-text mood search) is **deferred**. A frontend-only Claude call means an exposed key, so these ship later behind a `VisionService`/`LLMService` interface, gated on an optional user-supplied key in SecureStore, with a clear server-side migration path. **Nothing in MVP needs an LLM.**

**Deployment without an app store:** primary channel is the **Expo web export (PWA, static-hosted, link-shareable)**; Expo Go for the fast dev/demo loop; EAS Update (OTA) on an internally-distributed custom dev client for the full native experience. The persistence and repository layers are interface-driven so the _same codebase_ runs across all three (driver chosen at startup).

---

## 2. Tech stack

| Library                                                                                    | Why                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **expo (SDK 53+) + expo-router**                                                           | Managed app + file-based, typed routes with deep links (`gaybar://cocktail/[id]`). One route tree across iOS/Android/**web** — essential since web export is our no-store channel.                                                                    |
| **react-native + react**                                                                   | Core runtime, pinned by the Expo SDK so Expo Go / EAS Update stay compatible.                                                                                                                                                                         |
| **zustand**                                                                                | Single store for _user_ state (favourites, inventory, shopping list, settings, history). Tiny, selector-based (won't re-render the 119-card grid), identical on native+web. The catalog is **not** in zustand — it's static data behind a repository. |
| **react-native-mmkv**                                                                      | Fast synchronous JSI persistence for production native (instant hydration, no flash of empty favourites). **Not** available in Expo Go / web.                                                                                                         |
| **@react-native-async-storage/async-storage**                                              | Persistence driver that **does** run in Expo Go and on web (localStorage). Both sit behind one `KeyValueStore` interface, driver chosen at startup — this keeps the Expo Go / web testing path alive.                                                 |
| **@shopify/flash-list**                                                                    | Virtualized grid for the 119-card browse + filtered results; recycles rows, memory-bounded.                                                                                                                                                           |
| **expo-image**                                                                             | Renders the 238 bundled `.webp` cards with disk+memory cache, blurhash placeholder, native webp on all 3 platforms.                                                                                                                                   |
| **react-native-reanimated + react-native-gesture-handler**                                 | Front/back card-flip, pinch-zoom on card art, swipe in the stepper, smooth filter sheet. Expo-supported, run on web.                                                                                                                                  |
| **@gorhom/bottom-sheet**                                                                   | Filter sheet and tool-detail sheet.                                                                                                                                                                                                                   |
| **i18next + react-i18next**                                                                | UI _chrome_ strings in a single `uk` bundle. Domain text (names/ingredients/steps/tags) is rendered **verbatim**, never translated. Leaves a clean path to add `en` UI later.                                                                         |
| **expo-localization**                                                                      | Picks default locale (`uk`), locale-aware number formatting.                                                                                                                                                                                          |
| **expo-secure-store**                                                                      | Encrypted storage for the **optional, deferred** user-supplied Claude key. Native-only; web hides the feature.                                                                                                                                        |
| **expo-keep-awake**                                                                        | Keeps the screen on during the guided stepper.                                                                                                                                                                                                        |
| **expo-haptics**                                                                           | Feedback on star-rating, favourite, "Здивуй мене".                                                                                                                                                                                                    |
| **expo-font + @expo-google-fonts** (Playfair/Cormorant display + a Cyrillic-complete sans) | Art-deco display serif for names + readable body. **Must verify full Ukrainian glyph coverage (ґ, ї, є, typographic apostrophe ’) before locking a font.**                                                                                            |
| **expo-image-picker + expo-file-system**                                                   | Camera/library for user-recipe images (v2) and future photo inventory.                                                                                                                                                                                |
| **expo-sharing + expo-document-picker**                                                    | JSON export/import of user data (the local "sync" substitute).                                                                                                                                                                                        |
| **expo-crypto**                                                                            | uuid for profile id and record ids.                                                                                                                                                                                                                   |
| **date-fns (+ uk locale)**                                                                 | Ukrainian date formatting/grouping in history.                                                                                                                                                                                                        |
| **zod** (already a dep)                                                                    | Single source of truth for the model. Reused at runtime to validate future HTTP payloads and to validate persisted user-state on hydration (migration safety).                                                                                        |
| **@tanstack/react-query** (optional, phase 2)                                              | Async cache for when the repo becomes HTTP-backed. Repo interfaces are already async, so it slots in without UI churn.                                                                                                                                |
| **react-hook-form** (v2)                                                                   | Add-your-own-recipe form state.                                                                                                                                                                                                                       |

---

## 3. Architecture

Three layers, strictly separated:

1. **Data sources** behind repository interfaces (`src/data/`). Local impls now, HTTP impls later. A single `createRepositories(config)` factory + `useRepositories()` context is the **only** place that knows which impl is live.
2. **Pure domain logic** (`src/domain/`). Functions take plain data in, return data out. Import nothing from React, the store, or any data source. These are unit-testable today and **move to the Node backend verbatim**.
3. **UI** (`app/`, `src/components/`). Talks to repositories via hooks and calls domain functions. Never imports `recipes/index.ts` directly, never reads storage directly.

### Where data lives

- **Recipes:** static, read-only, **bundled** (imported from `recipes/index.ts`). Not app state, not a database — a data source behind `CocktailRepository`. _(Caveat below.)_
- **User data:** on-device via `KeyValueStore` (MMKV native / AsyncStorage Expo-Go+web). Namespaced `gaybar/v1/{profileId}/...`. Bulk records in the KV store; **secrets only** (future tokens, optional Claude key) in SecureStore; **user-recipe images on the filesystem**, never in KV.
- **Curated config** (new, all static, no per-recipe schema change): canonical ingredient catalog, canonical tool/glass catalog, tag-taxonomy map, strength-ordinal, moods map, base-spirit alias table. Live in `src/data/catalog/` as plain modules/JSON.

### Images

Bundle all 238 `.webp` via static `require` (verified: ~42MB, avg ~180KB — fine for native binary, acceptable for an OTA payload, heavier for first web load). **Metro can't glob or dynamic-`require` a path string**, so extend the generator to emit a **`recipes/images.ts` registry**: `id -> { front: require('./NNN-slug/front.webp'), back: require('./NNN-slug/back.webp') }`. UI resolves images by `id` through an **`assetResolver`**, never by path string — so the local require-map vs a future remote URL is a swappable seam. Render with `expo-image`. If web first-paint suffers: eager `front.webp`, lazy `back.webp`, or move to a CDN behind the resolver.

### Key TypeScript interface shapes

```ts
// src/data/CocktailRepository.ts
export interface CocktailFilter {
  tags?: CocktailTag[]; // AND across groups, OR within a group
  search?: string; // name / nameEn / cardNumber / ingredient (normalized)
  ingredientKeys?: string[]; // canonical ids, for "what can I make"
  baseSpirit?: string; // derived, v2
}
export interface CocktailRepository {
  getAll(): Promise<Cocktail[]>;
  getById(id: string): Promise<Cocktail | null>;
  query(filter: CocktailFilter): Promise<Cocktail[]>;
  allTags(): Promise<CocktailTag[]>;
  allIngredients(): Promise<CanonicalIngredient[]>;
}

// src/data/ToolRepository.ts
export interface ToolRepository {
  getByRawName(raw: string): CanonicalTool | null; // folds OCR/spelling variants
  getAll(): CanonicalTool[];
}

// src/data/persistence
export interface KeyValueStore {
  // MMKV or AsyncStorage driver
  getString(k: string): string | null | Promise<string | null>;
  set(k: string, v: string): void | Promise<void>;
  delete(k: string): void | Promise<void>;
}
export interface UserStateRepository {
  // favourites, inventory, shopping, history, prefs
  load(): Promise<UserState>;
  save(state: UserState): Promise<void>;
  patch(p: Partial<UserState>): Promise<void>;
}
export interface SessionRepository {
  // resume the guided stepper
  get(): Promise<ActiveSession | null>;
  set(s: ActiveSession): Promise<void>;
  clear(): Promise<void>;
}

// Deferred, key-gated, swappable to server-side:
export interface VisionService {
  detectBottles(imageUri: string): Promise<string[]>;
}
export interface LLMService {
  moodSearch(query: string, cocktails: Cocktail[]): Promise<string[]>;
}
```

```ts
// New curated catalog types (static config, NOT changes to CocktailSchema)
export interface CanonicalIngredient {
  id: string;
  nameUk: string;
  aliases: string[];
  category:
    | "spirit"
    | "liqueur"
    | "juice"
    | "syrup"
    | "fruit"
    | "herb"
    | "bitters"
    | "dairy"
    | "ice"
    | "garnish"
    | "mixer"
    | "pantry";
  isPantryStaple: boolean;
  seasonMonths?: number[];
  availability?: "year-round" | "seasonal" | "specialty"; // 'later'
}
export interface CanonicalTool {
  id: string;
  nameUk: string;
  aliases: string[];
  category: "shaking" | "straining" | "measuring" | "muddling" | "glassware" | "garnish";
  dualRole?: boolean; // tool that is also glassware (Чарка, Тікі-келих, Харрікейн)
  description?: string;
  image?: string; // optional, lit up incrementally
}
```

```ts
// Pure domain functions — data in / data out, no React/storage/data-source imports
search(cocktails, query): Cocktail[]
applyFilters(cocktails, filter, taxonomy): Cocktail[]
sortBy(cocktails, mode): Cocktail[]              // localeCompare('uk') for А→Я
deriveBaseSpirit(cocktail, aliasTable): string   // from lead spirit ingredient
recommendByMood(cocktails, moodKey, moodsMap): Cocktail[]
formatIngredient(ingredient): string             // "Лаймовий сік — 30 мл" / "за смаком"
whatCanIMake(cocktails, ownedIds, catalog): { makeable: [], almost: [{cocktail, missing}] }
buildShoppingList(selected, servings, owned, catalog): ShoppingLine[]  // sum by canonical id, group by unit
stepProgress(steps, index): { current, total, pct }
```

> **Bundling caveat (verified, must fix before relying on the index):** `recipes/index.ts` is generated with **node-style import assertions (`with { type: "json" }`) and `.js` import extensions** — this will not bundle cleanly under Metro/Expo as-is. **First foundation task:** add an RN-friendly generated index/adapter (drop `with`, import `recipe.json` the Metro way) and emit `recipes/images.ts`. Treat this as a blocker for everything that reads recipes.

---

## 4. Screens / navigation map

`expo-router`, bottom tabs wrapping stacks. Catalog reads go through the repository, never imported into screens.

```
app/_layout.tsx                 root: ThemeProvider, i18n, fonts, store hydration gate
app/(tabs)/_layout.tsx          Tabs
  ├─ index.tsx                  Колекція — browse grid + search + mood tiles + sort; entry to Filters
  ├─ bar.tsx                    Мій бар — inventory (ingredients + tools) + "Що я можу зробити"
  ├─ shopping.tsx               Список покупок — aggregated, scaled, owned-subtracted, checkable
  └─ favourites.tsx             Обране — favourited subset
app/filters.tsx                 Фільтри (route-backed modal): grouped tag chips + live count
app/cocktail/[id].tsx           Картка / Рецепт — flip front/back, tags, ingredients, tools+glass, steps, CTA
app/cocktail/[id]/make.tsx      Покрокове приготування — full-screen stepper (+ mise en place, resume)
app/tool/[id].tsx               (sheet) Як виглядає інструмент — tool image/description
app/recipe/new.tsx              Додати свій рецепт (v2)
app/history.tsx                 Історія приготувань (v2)
app/settings.tsx               Налаштування — theme (dark v1), language, optional Claude key (deferred)
app/+not-found.tsx              unknown deep links / bad web URLs
```

Theme: locked **dark art-deco** for v1 (deep charcoal bg, brass/gold accent, ivory text, thin gold hairlines), central `src/theme/theme.ts` via `useTheme()`; components consume tokens, never hardcode colours.

---

## 5. Data model additions needed

**Already supported by the current 119-recipe schema (no new data):**

- Search (#4) — `name` (119/119), `nameEn` (119/119), `id`, `cardNumber`, ingredient names. ✅
- Mood/flavour recs (#5) & taste/strength filter+sort (#6) — `tags[]`; **strength is 100% clean** (every recipe exactly one of міцні/слабоалкогольні/безалкогольні), flavour coverage 100%. ✅
- Full steps (#7) — `steps[]` on 119/119, ordered Ukrainian. ✅
- Display required tools per recipe (#8, show-half) — `tools[]` + `glass`. ✅
- Per-recipe quantities for shopping math (#2, per-drink) — `amount`+`unit` on 796/805 rows. ✅

**New data required:**

| Addition                                                                                                                    | Blocker / Nice-to-have                                                                                                                                               | For notes       | How produced                                                        |
| --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------- |
| **Canonical ingredient catalog** (`id`, `nameUk`, `aliases[]` folding 255 raw forms + brands, `category`, `isPantryStaple`) | **Blocker** (inventory & shopping are wrong without it — naive string match fails "Срібна текіла" vs "Срібна текіла Sauza"; ice in 103/119 breaks "what can I make") | 1, 2            | LLM-assisted draft → **human review** (do not auto-fuzzy)           |
| **Canonical tool catalog** (`id`, `nameUk`, `aliases[]` folding Джигер/Джиггер/Джиґер etc., `category`, `dualRole`)         | **Blocker** for owned-tools filter (#8); prereq for tool images                                                                                                      | 8, 12           | LLM-assisted → human review; 55+21 strings, small                   |
| **Glass canonicalization + backfill 1 missing glass**; union `tools[]`+`glass` (8 recipes have a glass not in tools)        | **Blocker** for correct tool requirements                                                                                                                            | 7, 8            | Same catalog                                                        |
| **Per-ingredient `optional/garnish` flag**                                                                                  | Nice-to-have (partly derivable from no-amount / note='за смаком')                                                                                                    | 1               | Derived + curated                                                   |
| **Tag-taxonomy map** (50 flat tags → strength/taste/base/family axes + UK group labels)                                     | **Blocker for usable filter UI** (else a wall of 50 chips); only piece of curation discovery truly needs                                                             | 5, 6, 10        | Hand-authored const (from cocktail.ts comment groups)               |
| **Strength-ordinal map** (3 values) + **moods→tag-query map** (~6-10)                                                       | Nice-to-have                                                                                                                                                         | 5, 6            | Trivial static const                                                |
| **Base-spirit alias table** (lead spirit → gin/rum/tequila…)                                                                | **Blocker for base filter** (only 37/119 carry a base tag; tag-only hides 69%)                                                                                       | 6               | Curated table over ingredient names, reviewed                       |
| **~63 tool/glass reference images** + short UK descriptions                                                                 | Nice-to-have (ships as placeholders; data model already has optional `image`)                                                                                        | 12              | **Photograph real tools** (avoid licensing); does not exist on disk |
| **Curated sets/flights** (`{id, title, cocktailIds[], theme}`)                                                              | Nice-to-have (auto-flights need no data)                                                                                                                             | 9               | Manual curation                                                     |
| **Seasonality/availability** per produce ingredient (`monthsInSeason[]`, `availability`, `region:'UA'`)                     | Nice-to-have, **weakest-grounded**, region-bound, approximate; only ~30-40 produce items matter                                                                      | 3               | LLM-assisted, framed "приблизно"                                    |
| **User data layer** (profile, ratings, favourites, owned ingredients/tools, prefs, history)                                 | Nice-to-have technically, but **the substrate for #1/#8/#10/#13/#14**                                                                                                | 1,8,10,11,13,14 | New on-device store (this app introduces it)                        |
| **Relaxed `UserRecipeSchema`** (tags/units as free strings, `cardNumber` optional, `origin:'user'`, image as file URI)      | Nice-to-have                                                                                                                                                         | 11              | Schema fork of `CocktailSchema`                                     |
| **Per-step structure** (referenced ingredient/tool ids, `durationSec`, action type)                                         | Nice-to-have (steps are free text; enables timers/highlighting)                                                                                                      | 15              | LLM-assisted annotation                                             |
| **`baseServings` / difficulty / numeric strength score**                                                                    | Nice-to-have (cards are 1 serving; scale by drinks × drinks-per-person works without it)                                                                             | 2, 6, 15        | Derived                                                             |

> Personalization keys on **`id`, not `cardNumber`** — `cardNumber` has gaps (e.g. 041-045, 085 missing; 119 of ~125 present). Keying on `cardNumber` would break.

---

## 6. Feature roadmap

Status legend: **yes** = frontend-only today · **needs-llm-key** = deferred behind user-supplied key · **needs-backend** = real version waits for server.

### MVP — ship a correct, fully offline, Ukrainian app

| Feature (UK / EN)                                                                              | What it does                                                                                                                                                                  | FE status                                            | Effort | Key deps                            |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------ | ----------------------------------- |
| **(internal) Foundation: Expo shell + repo/service layer + Metro-safe index + image registry** | Stands up app, tabs, theme, i18n, `KeyValueStore` drivers, all repository interfaces + Local impls, pure-domain folder. Fixes the `index.ts` import-assertion bundling issue. | yes                                                  | L      | —                                   |
| **Усі коктейлі / Browse All** (#4,5,6)                                                         | FlashList grid of 119 cards (front.webp), name + strength chip + flavour chips, sort toggle                                                                                   | yes                                                  | M      | foundation, image registry          |
| **Пошук / Search** (#4)                                                                        | Debounced search over name/nameEn/cardNumber/ingredients; NFC-normalize, strip apostrophes, handle і/ї/є/ґ                                                                    | yes                                                  | S      | pure `search()`                     |
| **Фільтри: смак і міцність / Taste & strength filter** (#5,6)                                  | Strength segmented control + multi-select flavour chips, grouped by taxonomy, live count                                                                                      | yes                                                  | M      | tag-taxonomy, `applyFilters()`      |
| **За настроєм / Mood tiles** (#5)                                                              | ~6-10 preset mood tiles → pre-filtered ranked list; "Здивуй мене" weighted-random                                                                                             | yes                                                  | S      | moods map, `recommendByMood()`      |
| **Сортування / Sort** (#6)                                                                     | By card #, А→Я (`localeCompare('uk')`), strength ordinal, ingredient count                                                                                                    | yes                                                  | S      | comparators                         |
| **Рецепт / Cocktail detail** (#7)                                                              | Hero + flip front/back, tags, ingredients (formatted), tools+glass section, steps, "Почати приготування"                                                                      | yes                                                  | M      | `formatIngredient()`, tool catalog  |
| **Форматування інгредієнтів / Ingredient formatter** (#7)                                      | Pure render of `{name,amount,unit,note}`; handles за смаком, ranges; reused by shopping/stepper                                                                               | yes                                                  | S      | —                                   |
| **Інструменти та посуд / Tools & Glass section + Tool catalog** (#8)                           | Render normalized tools+glass as chips; build the canonical tool/glass dictionary (shared with inventory)                                                                     | yes                                                  | M      | tool catalog                        |
| **Покрокове приготування / Guided stepper** (#15,7)                                            | One step at a time, progress, Назад/Далі + swipe, keep-awake, "Готово" hand-off                                                                                               | yes                                                  | L      | `stepProgress()`, SessionRepository |
| **Довідник інгредієнтів/інструментів / Canonical dictionary** (#1,8)                           | Normalization backbone: 255 ingredients + 55 tools → canonical ids, categories, pantry-staple flags                                                                           | yes                                                  | L      | — (curated data)                    |
| **Мій бар / My Bar inventory** (#1)                                                            | Add owned ingredients via UK autocomplete over canonical names; pantry staples pre-owned                                                                                      | yes                                                  | M      | dictionary, InventoryRepo           |
| **Що я можу приготувати / What can I make** (#1)                                               | Per-cocktail MAKEABLE / ALMOST (missing 1-2), optional rows ignored; sortable                                                                                                 | yes                                                  | M      | `whatCanIMake()`                    |
| **Фільтр за моїми інструментами / Owned-tools filter** (#8)                                    | Filter to "tools I have"; per-recipe owned/missing badges; union tools+glass                                                                                                  | yes                                                  | M      | tool catalog, InventoryRepo         |
| **Фільтр за настроєм / Shared mood-tag selector** (#2)                                         | Reusable grouped tag predicate to scope shopping/flights                                                                                                                      | yes                                                  | S      | tag-taxonomy                        |
| **Список покупок / Shopping list** (#2)                                                        | Pick cocktails or mood+count, set people; aggregate by canonical id, group by unit, subtract owned; export/share                                                              | yes                                                  | L      | dictionary, `buildShoppingList()`   |
| **Оцінка коктейлю / Rating** (#13)                                                             | 1-5 stars + optional UK note per cocktail; feeds sort & shelves                                                                                                               | yes                                                  | S      | PersonalizationRepo                 |
| **Обране / Favourites** (#10)                                                                  | Heart toggle + Обране tab; primary preference signal for later recs                                                                                                           | yes                                                  | S      | PersonalizationRepo                 |
| **Мої смаки / Taste-preference profile** (#10)                                                 | Skippable onboarding: liked/disliked tags + preferred strength                                                                                                                | yes                                                  | M      | tag-taxonomy, PersonalizationRepo   |
| **Профіль / Local profile + Export-Import** (#10 substitute)                                   | Silent local profile (uuid) owning all user data; JSON export/import (the "sync" stand-in); schemaVersion + migrations                                                        | **needs-backend** (real cross-device login deferred) | M      | PersonalizationRepo                 |

### v2

| Feature (UK / EN)                                             | What it does                                                                                           | FE status         | Effort | Key deps                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------- | ------ | -------------------------------------------------------------- |
| **Фільтр: основа / Base-spirit filter** (#6)                  | Derive base from lead spirit + alias table; tag as confirming hint                                     | yes               | M      | `deriveBaseSpirit()`, alias table                              |
| **Як виглядає інструмент / Tool detail sheet** (#12)          | Tap tool → image + description; placeholders until photos exist                                        | yes               | M      | tool catalog, **~63 images**                                   |
| **Підготовка (чек-лист) / Mise en place** (#15,7,8)           | Pre-step checklist of all ingredients + tools/glass                                                    | yes               | S      | stepper, formatter                                             |
| **Продовжити приготування / Resume session** (#15)            | Persist & resume mid-stepper                                                                           | yes               | S      | SessionRepository                                              |
| **Оригінал картки / View printed card** (#7)                  | Zoomable back.webp/front.webp viewer (verified legible for all 119)                                    | yes               | S      | asset bundling                                                 |
| **Сети та флайти / Sets & flights** (#9)                      | Auto-flights (tag-based) + curated named sets; link into shopping & "what can I make"                  | yes               | M      | mood selector, shopping list                                   |
| **Історія приготувань / Preparation history** (#14)           | Log on stepper-finish or "Я це зробив/-ла"; reverse-chron list + stats; denormalized snapshots         | yes               | M      | profile, ratings, stepper event                                |
| **Додати свій рецепт / Add your own recipe** (#11)            | Form → relaxed UserRecipeSchema; user recipes first-class everywhere; camera/library image as file URI | yes               | L      | profile, merged RecipeRepository, **image-source abstraction** |
| **Додати фото пляшок / Photo inventory (Claude vision)** (#1) | Snap shelf → Claude vision → match to canonical ingredients → user confirms                            | **needs-llm-key** | L      | dictionary, VisionService, SecureStore key                     |

### Later

| Feature (UK / EN)                                                              | What it does                                                                              | FE status         | Effort | Key deps                              |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ----------------- | ------ | ------------------------------------- |
| **Сезонність і наявність / Seasonality & availability** (#3)                   | "In season now" badges + off-season warnings for ~30-40 produce items (UA, "приблизно")   | yes               | M      | dictionary + new seasonality data     |
| **Таймер кроку / Step timer** (#15)                                            | MVP-cheap manual stopwatch now; auto shake/stir timer needs per-step duration annotations | yes               | M      | stepper (+ step annotations for auto) |
| **Вільний пошук за настроєм / Free-text NL mood search** (#5)                  | "something fruity but gin-based, not too sweet" → Claude                                  | **needs-llm-key** | M      | LLMService, SecureStore key           |
| **Справжня авторизація + хмарна синхронізація / Real auth + cloud sync** (#10) | Account login, cross-device sync; local profileId adopted by the account                  | **needs-backend** | XL     | Node backend, Http\* repos            |

### Mapping of all 15 notes

1 → My Bar + What-can-I-make + dictionary (MVP); photo inventory (v2, needs-llm-key). · 2 → Shopping list + mood selector (MVP). · 3 → Seasonality (Later). · 4 → Search (MVP). · 5 → Mood tiles (MVP); NL mood search (Later, needs-llm-key). · 6 → Taste/strength filter + sort (MVP), base filter (v2). · 7 → Detail + view original card (MVP/v2). · 8 → Tools section + owned-tools filter (MVP). · 9 → Sets & flights (v2). · 10 **"????"** → Favourites + preferences + **local profile with export/import as the on-device auth substitute** (MVP); **real auth = needs-backend (Later)**. · 11 **"????"** → **Add your own recipe** (v2) via relaxed `UserRecipeSchema` + image-source abstraction; frontend-only, no LLM. · 12 → Tool detail sheet (v2, needs ~63 tool photos). · 13 → Ratings (MVP). · 14 → History (v2). · 15 → Guided stepper (MVP), mise en place/resume (v2), step timers (Later).

**AI/photo resolution:** photo inventory (#1) and NL mood search (#5) are the only LLM features — both deferred, both routed through `VisionService`/`LLMService` interfaces, gated on an optional SecureStore-stored user key, web-hidden, with a documented path to move the call server-side once the Node backend exists. Add-recipe photos (#11) are **not** an LLM feature — they're plain `expo-image-picker` file URIs, frontend-only.

---

## 7. Open questions for the user

1. **MVP scope cut.** The MVP list above is broad. Is the floor **Browse + Search + Filter + Detail + Stepper** (pure discovery+recipe, fastest to ship), or must **My Bar + What-can-I-make + Shopping list** (which depend on the L-effort canonical dictionary) be in the first release too?
2. **Canonical dictionary effort.** The ingredient/tool dictionary is the backbone of inventory & shopping and needs **human review of ~255 ingredient + ~76 tool/glass strings** (LLM draft is not trustworthy enough to ship unreviewed). Will you do this curation, or should I generate a draft for you to correct?
3. **Ingredient granularity.** Should spirits be brand-collapsed (does "Лондонський сухий джин" == "джин"?) Recommendation: **separate ids for spirits, merged for juices/syrups** — confirm, as it sets how generous "what can I make" feels.
4. **Tool images (#12).** Photograph your real bar tools (cleanest, no licensing), source/generate, or **ship placeholders indefinitely** and light up later? This is the main cost of the tool-detail feature.
5. **Seasonality data (#3).** It's UA-specific, approximate, and quickly stale. OK to defer to "Later" and frame as "приблизно", or is it higher priority than I've ranked it?
6. **Ship a user-supplied Claude key at all?** For the deferred photo-inventory / NL-search features — do you want the SecureStore key flow built (advanced users paste their own key) **now**, or fully stubbed until a backend can hold the key server-side? (Recommendation: stub now, build later.)
7. **Add-your-own-recipe (#11) shape.** Minimal create-only (name/ingredients/steps) for v2, or the full form with tag/tool/glass pickers? And: should user recipes ever sync to the (future) backend — i.e. design image refs for upload from day one?
8. **Deployment primary channel.** Confirm **web PWA as the main no-store channel** (with Expo Go for dev and an internal EAS-Update dev client for full-native testing). If web is primary, MMKV/SecureStore-only features (photo inventory) are web-hidden — acceptable?
9. **Fonts.** Approve an art-deco display serif (Playfair/Cormorant) **only after** verifying full Ukrainian Cyrillic + typographic apostrophe coverage — do you have a brand font, or should I pick a verified Google Font pairing?
10. **First foundation task confirmation.** The generated `recipes/index.ts` uses node import assertions (`with { type: "json" }`) + `.js` extensions that won't bundle under Metro. OK to add an RN-friendly generated index + `recipes/images.ts` registry as task #1 (keeps the existing node pipeline intact)?

Relevant files inspected: `/Users/antonlomovatskyi/personal-projects/gaybar/src/types/cocktail.ts` (zod schema to reuse/relax), `/Users/antonlomovatskyi/personal-projects/gaybar/recipes/index.ts` (read-only `cocktails[]`; **bundling caveat above**), `/Users/antonlomovatskyi/personal-projects/gaybar/scripts/gen-index.ts` (extend to emit image registry), `/Users/antonlomovatskyi/personal-projects/gaybar/recipes/004-margarita/recipe.json` (record shape). No `app/` or `store/` exists yet — this plan introduces them.
