import clsx from "clsx";
import { Link } from "react-router-dom";
import { Chip } from "@/components/Chip";
import { exportData, importDataFromFile } from "@/data/backup";
import { TAG_GROUPS } from "@/data/catalog/taxonomy";
import { firebaseEnabled } from "@/lib/firebase";
import { pullNow, pushNow, signInWithGoogle, signOutNow, useAuthStore } from "@/lib/sync";
import { useUserStore } from "@/store/userStore";

function Seg<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={clsx(
            "flex-1 rounded-full border px-3 py-1.5 text-sm transition",
            value === o.value
              ? "border-gold bg-gold/15 text-text"
              : "border-border bg-surface-alt text-text-dim hover:border-gold/60",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 font-bold text-gold">{title}</div>
      {children}
    </div>
  );
}

function SyncCard() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const statusLabel =
    status === "syncing"
      ? "Синхронізація…"
      : status === "saved"
        ? "Збережено в хмарі ✓"
        : status === "error"
          ? "Помилка синхронізації"
          : "";

  if (!firebaseEnabled) {
    return (
      <Card title="Синхронізація">
        <div className="text-sm text-text-dim">
          Хмарна синхронізація ще не налаштована. Дані зберігаються лише на цьому пристрої — або користуйся резервною
          копією нижче.
        </div>
      </Card>
    );
  }

  return (
    <Card title="Синхронізація">
      {user ? (
        <div className="flex flex-col gap-3">
          <div className="text-sm text-text">
            Увійшов як <span className="text-gold">{user.displayName ?? user.email}</span>
          </div>
          {statusLabel && <div className="text-xs text-text-faint">{statusLabel}</div>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => pushNow()}
              className="flex-1 rounded-xl border border-border bg-surface-alt px-4 py-3 text-text"
            >
              Зберегти в хмару
            </button>
            <button
              type="button"
              onClick={() => pullNow()}
              className="flex-1 rounded-xl border border-border bg-surface-alt px-4 py-3 text-text"
            >
              Завантажити
            </button>
          </div>
          <button
            type="button"
            onClick={() => signOutNow()}
            className="rounded-xl border border-border bg-surface-alt px-4 py-3 text-danger"
          >
            Вийти
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="text-sm text-text-dim">
            Увійди, щоб синхронізувати бар, обране та рецепти між телефоном і ПК.
          </div>
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="rounded-xl bg-gold px-4 py-3 text-center font-bold text-bg"
          >
            Увійти через Google
          </button>
        </div>
      )}
    </Card>
  );
}

export default function Settings() {
  const flexibleMatching = useUserStore((s) => s.flexibleMatching);
  const setFlexibleMatching = useUserStore((s) => s.setFlexibleMatching);
  const language = useUserStore((s) => s.language);
  const setLanguage = useUserStore((s) => s.setLanguage);
  const units = useUserStore((s) => s.units);
  const setUnits = useUserStore((s) => s.setUnits);
  const theme = useUserStore((s) => s.theme);
  const setTheme = useUserStore((s) => s.setTheme);
  const prefs = useUserStore((s) => s.prefs);
  const setPrefs = useUserStore((s) => s.setPrefs);
  const favourites = useUserStore((s) => s.favourites);
  const history = useUserStore((s) => s.history);
  const ownedIngredients = useUserStore((s) => s.ownedIngredients);
  const clearHistory = useUserStore((s) => s.clearHistory);
  const clearFavourites = useUserStore((s) => s.clearFavourites);

  const toggleLikedTag = (tag: string) => {
    const liked = prefs.likedTags.includes(tag) ? prefs.likedTags.filter((x) => x !== tag) : [...prefs.likedTags, tag];
    setPrefs({ likedTags: liked });
  };

  const onImport = async () => {
    const r = await importDataFromFile();
    window.alert(r.message);
  };

  const onClearHistory = () => {
    if (window.confirm("Очистити історію приготувань?")) clearHistory();
  };

  const onClearFavourites = () => {
    if (window.confirm("Очистити список обраного?")) clearFavourites();
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <Card title="Підбір">
        <button
          type="button"
          onClick={() => setFlexibleMatching(!flexibleMatching)}
          className="flex w-full items-start justify-between gap-3 text-left"
        >
          <div>
            <div className="text-text">Гнучкий підбір</div>
            <div className="mt-0.5 text-sm text-text-dim">Дозволяти заміни схожим (ром замість білого рому).</div>
          </div>
          <div
            className={clsx(
              "mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full border px-0.5 transition",
              flexibleMatching ? "justify-end border-gold bg-gold/15" : "justify-start border-border bg-surface-alt",
            )}
          >
            <div className={clsx("h-4 w-4 rounded-full transition", flexibleMatching ? "bg-gold" : "bg-text-faint")} />
          </div>
        </button>
        <div className="mt-3 text-sm text-text-faint">Доступність інгредієнтів: Чернівці 📍</div>
      </Card>

      <SyncCard />

      <Card title="Вигляд та мова">
        <div className="flex flex-col gap-3">
          <div>
            <div className="mb-1.5 text-sm text-text-dim">Мова</div>
            <Seg
              value={language}
              onChange={setLanguage}
              options={[
                { value: "uk", label: "Українська" },
                { value: "en", label: "English" },
              ]}
            />
          </div>
          <div>
            <div className="mb-1.5 text-sm text-text-dim">Одиниці</div>
            <Seg
              value={units}
              onChange={setUnits}
              options={[
                { value: "ml", label: "мл" },
                { value: "oz", label: "oz" },
              ]}
            />
          </div>
          <div>
            <div className="mb-1.5 text-sm text-text-dim">Тема</div>
            <Seg
              value={theme}
              onChange={setTheme}
              options={[
                { value: "dark", label: "Темна" },
                { value: "light", label: "Світла" },
              ]}
            />
          </div>
        </div>
      </Card>

      <Card title="Смаки (для рекомендацій)">
        <div className="flex flex-col gap-3">
          {TAG_GROUPS.map((g) => (
            <div key={g.key}>
              <div className="mb-1.5 text-sm text-text-dim">{g.labelUk}</div>
              <div className="flex flex-wrap gap-2">
                {g.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    selected={prefs.likedTags.includes(tag)}
                    onClick={() => toggleLikedTag(tag)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Розділи">
        <div className="flex flex-col gap-2">
          <Link
            to="/history"
            className="flex items-center justify-between rounded-xl border border-border bg-surface-alt px-4 py-3 text-text"
          >
            <span>🕘 Історія приготувань</span>
            <span className="text-text-faint">{history.length}</span>
          </Link>
          <Link to="/recipe/new" className="rounded-xl border border-border bg-surface-alt px-4 py-3 text-text">
            ＋ Додати свій рецепт
          </Link>
        </div>
      </Card>

      <Card title="Резервна копія">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => exportData(Date.now())}
            className="rounded-xl border border-border bg-surface-alt px-4 py-3 text-text"
          >
            ⬆️ Експортувати дані
          </button>
          <button
            type="button"
            onClick={onImport}
            className="rounded-xl border border-border bg-surface-alt px-4 py-3 text-text"
          >
            ⬇️ Імпортувати дані
          </button>
        </div>
      </Card>

      <Card title="Дані">
        <div className="mb-3 flex justify-between text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-text">{favourites.length}</div>
            <div className="text-text-dim">Обране</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-text">{history.length}</div>
            <div className="text-text-dim">Історія</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-text">{ownedIngredients.length}</div>
            <div className="text-text-dim">Бар</div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onClearHistory}
            className="rounded-xl border border-border bg-surface-alt px-4 py-3 text-danger"
          >
            Очистити історію
          </button>
          <button
            type="button"
            onClick={onClearFavourites}
            className="rounded-xl border border-border bg-surface-alt px-4 py-3 text-danger"
          >
            Очистити обране
          </button>
        </div>
      </Card>
    </div>
  );
}
