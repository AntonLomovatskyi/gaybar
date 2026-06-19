# gaybar 🍸

A Ukrainian cocktail app built from a physical recipe deck (Expo / React Native). Offline-first,
on-device, framework-ready to lift into a backend later.

## Run

```bash
pnpm install
pnpm start            # Expo dev server (press w for web, or scan the QR with Expo Go)
pnpm web              # web only
```

## Quality

```bash
pnpm check            # prettier --check + eslint + tsc
pnpm test             # Vitest (pure domain logic)
pnpm lint  / lint:fix
pnpm format
```

A husky pre-commit hook runs `lint-staged` (prettier + eslint on staged files); GitHub Actions
runs `pnpm check` + `pnpm test` on push/PR.

## Architecture

- **`app/`** — screens (expo-router): Колекція (browse), Сети (party planner), Мій бар, Покупки,
  Обране; recipe detail + guided stepper; tool detail; settings; history; add/edit recipe.
- **`src/domain/`** — pure logic (search, filter, inventory matching, shopping, party, recommend).
  No React/storage imports → unit-tested and liftable to a Node backend unchanged.
- **`src/data/`** — data seam (`useCocktails`), `catalog/` (taxonomy, ingredient catalog +
  Chernivtsi availability, tools, families), `generated/` (bundled recipes + image map).
- **`src/store/`** — zustand (user data persisted via AsyncStorage; filter/party transient).
- **`src/theme`, `src/i18n`** — dark/light theme; uk/en strings via `useT()`.

## Data pipeline (`scripts/`)

`recipes/<n>-<slug>/` (recipe.json + front/back webp) is the source of truth — the original
deck photos and the friend's raw data have been removed, so everything regenerates from here.

```bash
pnpm gen:app-data     # recipes/*/recipe.json -> src/data/generated (run after editing recipes)
pnpm gen:catalog      # scripts/catalog-draft.json -> ingredient catalog + Chernivtsi availability
pnpm gen:card-image   # generate a card image for a recipe missing front.webp
pnpm gen:icons        # app icon / splash / favicon
pnpm validate         # schema-check every recipe.json
```

## Deploy (no app store)

- **Web (PWA):** `pnpm export:web` → static `dist/` (host anywhere) or `pnpm deploy:web`
  (EAS Hosting, needs `eas login`).
- **Native build:** `eas build --profile preview` (installable internal build) — see `eas.json`.
