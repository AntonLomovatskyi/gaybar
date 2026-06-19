/**
 * Backup & restore all on-device user data (favourites, ratings, bar, shopping, history,
 * prefs, your recipes) as a JSON file. The "sync substitute" until a backend exists.
 */
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { useUserStore, type PersistedData } from "@/store/userStore";

function snapshot(): PersistedData {
  const s = useUserStore.getState();
  return {
    favourites: s.favourites,
    ratings: s.ratings,
    ownedIngredients: s.ownedIngredients,
    ownedTools: s.ownedTools,
    shopping: s.shopping,
    history: s.history,
    prefs: s.prefs,
    userRecipes: s.userRecipes,
    flexibleMatching: s.flexibleMatching,
    language: s.language,
    units: s.units,
    theme: s.theme,
  };
}

export async function exportData(at: number): Promise<void> {
  const json = JSON.stringify({ app: "gaybar", version: 1, exportedAt: at, data: snapshot() }, null, 2);
  if (Platform.OS === "web") {
    const g = globalThis as any;
    const blob = new g.Blob([json], { type: "application/json" });
    const url = g.URL.createObjectURL(blob);
    const a = g.document.createElement("a");
    a.href = url;
    a.download = "gaybar-backup.json";
    a.click();
    g.URL.revokeObjectURL(url);
    return;
  }
  const uri = (FileSystem.cacheDirectory ?? "") + "gaybar-backup.json";
  await FileSystem.writeAsStringAsync(uri, json);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/json", dialogTitle: "Резервна копія gaybar" });
  }
}

export async function importDataFromFile(): Promise<{ ok: boolean; message: string }> {
  const res = await DocumentPicker.getDocumentAsync({ type: ["application/json", "*/*"], copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.length) return { ok: false, message: "Скасовано" };
  try {
    const text = await FileSystem.readAsStringAsync(res.assets[0].uri);
    const parsed = JSON.parse(text);
    const data = (parsed?.data ?? parsed) as Partial<PersistedData>;
    if (!data || typeof data !== "object") return { ok: false, message: "Невірний файл" };
    useUserStore.getState().importData(data);
    return { ok: true, message: "Дані відновлено" };
  } catch {
    return { ok: false, message: "Не вдалося прочитати файл" };
  }
}
