/**
 * Backup & restore all on-device user data (favourites, ratings, bar, shopping, history,
 * prefs, your recipes) as a JSON file. The "sync substitute" until a backend exists.
 */
import { useUserStore, type PersistedData } from "@/store/userStore";

export function getSnapshot(): PersistedData {
  const s = useUserStore.getState();
  return {
    favourites: s.favourites,
    wishlist: s.wishlist,
    ratings: s.ratings,
    notes: s.notes,
    ownedIngredients: s.ownedIngredients,
    ownedTools: s.ownedTools,
    shopping: s.shopping,
    boughtIngredients: s.boughtIngredients,
    history: s.history,
    prefs: s.prefs,
    userRecipes: s.userRecipes,
    flexibleMatching: s.flexibleMatching,
    language: s.language,
    units: s.units,
    theme: s.theme,
  };
}

/** Download the full user-data snapshot as a JSON file. */
export function exportData(at: number): void {
  const json = JSON.stringify({ app: "gaybar", version: 1, exportedAt: at, data: getSnapshot() }, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "gaybar-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

/** Open a file picker, read a backup JSON, and replace user data. */
export function importDataFromFile(): Promise<{ ok: boolean; message: string }> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve({ ok: false, message: "Скасовано" });
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const data = (parsed?.data ?? parsed) as Partial<PersistedData>;
        if (!data || typeof data !== "object") return resolve({ ok: false, message: "Невірний файл" });
        useUserStore.getState().importData(data);
        resolve({ ok: true, message: "Дані відновлено" });
      } catch {
        resolve({ ok: false, message: "Не вдалося прочитати файл" });
      }
    };
    input.click();
  });
}
