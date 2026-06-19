import { Link, Stack } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Chip } from "@/components/Chip";
import { TAG_GROUPS } from "@/data/catalog/taxonomy";
import { exportData, importDataFromFile } from "@/data/backup";
import { useUserStore } from "@/store/userStore";
import { useTheme } from "@/theme/theme";
import type { CocktailTag } from "@/types/cocktail";

export default function SettingsScreen() {
  const c = useTheme();
  const flexible = useUserStore((s) => s.flexibleMatching);
  const setFlexible = useUserStore((s) => s.setFlexibleMatching);
  const favCount = useUserStore((s) => s.favourites.length);
  const histCount = useUserStore((s) => s.history.length);
  const barCount = useUserStore((s) => s.ownedIngredients.length);
  const clearHistory = useUserStore((s) => s.clearHistory);
  const clearFavourites = useUserStore((s) => s.clearFavourites);
  const language = useUserStore((s) => s.language);
  const setLanguage = useUserStore((s) => s.setLanguage);
  const units = useUserStore((s) => s.units);
  const setUnits = useUserStore((s) => s.setUnits);
  const themeMode = useUserStore((s) => s.theme);
  const setTheme = useUserStore((s) => s.setTheme);
  const likedTags = useUserStore((s) => s.prefs.likedTags);
  const setPrefs = useUserStore((s) => s.setPrefs);

  const Seg = ({
    value,
    options,
    onChange,
  }: {
    value: string;
    options: { v: string; label: string }[];
    onChange: (v: string) => void;
  }) => (
    <View style={styles.seg}>
      {options.map((o) => (
        <Pressable
          key={o.v}
          onPress={() => onChange(o.v)}
          style={[
            styles.segBtn,
            {
              backgroundColor: value === o.v ? c.color.goldDim : c.color.surface,
              borderColor: value === o.v ? c.color.gold : c.color.border,
            },
          ]}
        >
          <Text style={{ color: value === o.v ? c.color.text : c.color.textDim }}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
  const toggleLiked = (tag: CocktailTag) =>
    setPrefs({ likedTags: likedTags.includes(tag) ? likedTags.filter((x) => x !== tag) : [...likedTags, tag] });

  const confirmClear = (label: string, fn: () => void) =>
    Alert.alert(label, "Дію не можна скасувати.", [
      { text: "Скасувати", style: "cancel" },
      { text: "Очистити", style: "destructive", onPress: fn },
    ]);

  const linkStyle = [styles.row, { borderColor: c.color.border, backgroundColor: c.color.surface }];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.color.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Stack.Screen options={{ title: "Налаштування" }} />

      <Text style={[styles.h, { color: c.color.gold }]}>Підбір</Text>
      <View style={[styles.card, { borderColor: c.color.border, backgroundColor: c.color.surface }]}>
        <View style={styles.toggle}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: c.color.text, fontSize: 15 }}>Гнучкий підбір</Text>
            <Text style={{ color: c.color.textDim, fontSize: 13, marginTop: 2 }}>
              Дозволяти заміни схожим (ром замість білого рому).
            </Text>
          </View>
          <Switch
            value={flexible}
            onValueChange={setFlexible}
            trackColor={{ true: c.color.goldDim }}
            thumbColor={flexible ? c.color.gold : undefined}
          />
        </View>
        <Text style={{ color: c.color.textFaint, fontSize: 13, marginTop: 10 }}>
          Доступність інгредієнтів: Чернівці 📍
        </Text>
      </View>

      <Text style={[styles.h, { color: c.color.gold, marginTop: 22 }]}>Вигляд та мова</Text>
      <View style={[styles.card, { borderColor: c.color.border, backgroundColor: c.color.surface }]}>
        <Text style={[styles.segLabel, { color: c.color.textDim }]}>Мова / Language</Text>
        <Seg
          value={language}
          onChange={(v) => setLanguage(v as "uk" | "en")}
          options={[
            { v: "uk", label: "Українська" },
            { v: "en", label: "English" },
          ]}
        />
        <Text style={[styles.segLabel, { color: c.color.textDim, marginTop: 12 }]}>Одиниці</Text>
        <Seg
          value={units}
          onChange={(v) => setUnits(v as "ml" | "oz")}
          options={[
            { v: "ml", label: "мл" },
            { v: "oz", label: "oz" },
          ]}
        />
        <Text style={[styles.segLabel, { color: c.color.textDim, marginTop: 12 }]}>Тема</Text>
        <Seg
          value={themeMode}
          onChange={(v) => setTheme(v as "dark" | "light")}
          options={[
            { v: "dark", label: "Темна" },
            { v: "light", label: "Світла" },
          ]}
        />
      </View>

      <Text style={[styles.h, { color: c.color.gold, marginTop: 22 }]}>Смаки (для рекомендацій)</Text>
      {TAG_GROUPS.map((g) => (
        <View key={g.key} style={{ marginBottom: 6 }}>
          <Text style={{ color: c.color.textFaint, fontSize: 12, marginBottom: 4 }}>{g.labelUk}</Text>
          <View style={styles.wrap}>
            {g.tags.map((tag) => (
              <Chip key={tag} label={tag} selected={likedTags.includes(tag)} onPress={() => toggleLiked(tag)} />
            ))}
          </View>
        </View>
      ))}

      <Text style={[styles.h, { color: c.color.gold, marginTop: 22 }]}>Розділи</Text>
      <Link href="/history" asChild>
        <Pressable style={linkStyle}>
          <Text style={{ color: c.color.text, fontSize: 16 }}>🕘 Історія приготувань</Text>
          <Text style={{ color: c.color.textDim }}>{histCount}</Text>
        </Pressable>
      </Link>
      <Link href="/recipe/new" asChild>
        <Pressable style={linkStyle}>
          <Text style={{ color: c.color.text, fontSize: 16 }}>＋ Додати свій рецепт</Text>
          <Text style={{ color: c.color.textDim }}>›</Text>
        </Pressable>
      </Link>

      <Text style={[styles.h, { color: c.color.gold, marginTop: 22 }]}>Резервна копія</Text>
      <Pressable
        style={linkStyle}
        onPress={async () => {
          try {
            await exportData(Date.now());
          } catch {
            Alert.alert("Помилка", "Не вдалося експортувати.");
          }
        }}
      >
        <Text style={{ color: c.color.text, fontSize: 16 }}>⬆️ Експортувати дані</Text>
        <Text style={{ color: c.color.textDim }}>›</Text>
      </Pressable>
      <Pressable
        style={linkStyle}
        onPress={() =>
          Alert.alert("Імпортувати дані?", "Замінить поточні обране/оцінки/бар/рецепти збереженими.", [
            { text: "Скасувати", style: "cancel" },
            {
              text: "Імпортувати",
              onPress: async () => {
                const r = await importDataFromFile();
                Alert.alert(r.ok ? "Готово" : "Імпорт", r.message);
              },
            },
          ])
        }
      >
        <Text style={{ color: c.color.text, fontSize: 16 }}>⬇️ Імпортувати дані</Text>
        <Text style={{ color: c.color.textDim }}>›</Text>
      </Pressable>

      <Text style={[styles.h, { color: c.color.gold, marginTop: 22 }]}>Дані</Text>
      <Text style={{ color: c.color.textDim, marginBottom: 8 }}>
        Обране: {favCount} · Історія: {histCount} · Бар: {barCount}
      </Text>
      <Pressable
        style={[styles.clear, { borderColor: c.color.border }]}
        onPress={() => confirmClear("Очистити історію?", clearHistory)}
      >
        <Text style={{ color: c.color.danger }}>Очистити історію</Text>
      </Pressable>
      <Pressable
        style={[styles.clear, { borderColor: c.color.border }]}
        onPress={() => confirmClear("Очистити обране?", clearFavourites)}
      >
        <Text style={{ color: c.color.danger }}>Очистити обране</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  h: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14 },
  toggle: { flexDirection: "row", alignItems: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  clear: { borderRadius: 12, borderWidth: 1, padding: 14, alignItems: "center", marginBottom: 10 },
  seg: { flexDirection: "row", gap: 8 },
  segBtn: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  segLabel: { fontSize: 13, marginBottom: 6 },
  wrap: { flexDirection: "row", flexWrap: "wrap" },
});
