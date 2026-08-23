# Cross-device sync (Firebase) — setup

The app syncs your data (bar, favourites, ratings, shopping, history, your recipes, prefs)
across devices via **Firebase Auth (Google) + Firestore**. The free **Spark** plan never
pauses. The web config is **public/safe to expose**. Sync stays off until these steps are done.

## 1. Create the project

1. https://console.firebase.google.com → **Add project** (e.g. `gaybar`). Analytics optional.
2. **Build → Authentication → Get started → Sign-in method → Google → Enable** (pick a support email), Save.
3. **Authentication → Settings → Authorized domains → Add domain:** `antonlomovatskyi.github.io` (and keep `localhost` for dev).
4. **Build → Firestore Database → Create database** → Production mode → pick a region.

## 2. Lock down Firestore (rules)

Firestore → **Rules** → paste and **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /menus/{menuId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Two collections, deliberately different:

- `users/{uid}` — your whole snapshot **including the Anthropic API key**. Readable and writable
  only by you. Never loosen this rule.
- `menus/{menuId}` — a guest menu: nothing but a list of cocktail ids and a title. World-readable
  so a guest can open the short share link without an account; writable only when signed in.

The same file lives in [`firestore.rules`](../firestore.rules) — paste it into the console
whenever it changes (this repo has no Firebase CLI deploy step).

## 3. Get the web config

Firebase → **Project settings (gear)** → **Your apps** → **Web app** (`</>`), register an app
(no Hosting needed) → copy the `firebaseConfig` values.

## 4. Wire the keys

**GitHub Pages (production):** repo → **Settings → Secrets and variables → Actions → Variables → New repository variable**, add each (names must match exactly):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN          (e.g. gaybar-xxxx.firebaseapp.com)
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Then re-run the **Deploy web to GitHub Pages** workflow (or push any commit) so the build picks them up.

**Local dev:** `cp .env.example .env.local` and fill the same values, then `pnpm dev`.

## How it works

- Settings → **Синхронізація** → **Увійти через Google**.
- On login: your cloud copy loads into the app. First login on a new account seeds the cloud
  from local. After that, local changes auto-save to the cloud (debounced ~1.5 s).
- Manual **Зберегти в хмару** / **Завантажити** buttons are there too.
- **Меню для гостей** → «Поділитися» publishes the drink ids to `menus/{id}` and hands you a
  short link (`…/guests?id=xxxxxxxx`). The id is stable, so pressing share again after restocking
  updates the menu everyone already has. Signed out (or if the write is refused) the app falls
  back to the self-contained `?m=id~id~…` link, which works offline but runs to a couple of KB.
- Sign in with the **same Google account** on phone and PC to share data. (Cloud is loaded on
  each login; for a personal single-user setup that's the intended last-device-wins behavior.)
