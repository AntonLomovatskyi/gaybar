import { Link, Stack } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAllCocktails } from "@/data/useCocktails";
import { useUserStore } from "@/store/userStore";
import { useTheme } from "@/theme/theme";

const pad = (n: number) => String(n).padStart(2, "0");
const dateKey = (ms: number) => {
  const d = new Date(ms);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
};
const timeStr = (ms: number) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function HistoryScreen() {
  const c = useTheme();
  const history = useUserStore((s) => s.history);
  const all = useAllCocktails();

  // group consecutive entries by day (history is newest-first)
  const groups: { date: string; items: typeof history }[] = [];
  for (const e of history) {
    const date = dateKey(e.at);
    const last = groups[groups.length - 1];
    if (last && last.date === date) last.items.push(e);
    else groups.push({ date, items: [e] });
  }

  if (!history.length) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Історія" }} />
        <Text style={{ color: c.color.textDim, textAlign: "center", paddingHorizontal: 32 }}>
          Тут зʼявляться коктейлі, які ти приготуєш.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.color.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Stack.Screen options={{ title: "Історія" }} />
      <Text style={{ color: c.color.textFaint, marginBottom: 12 }}>{history.length} приготувань</Text>
      {groups.map((g) => (
        <View key={g.date} style={{ marginBottom: 18 }}>
          <Text style={[styles.date, { color: c.color.gold }]}>{g.date}</Text>
          {g.items.map((e, i) => {
            const ck = all.find((x) => x.id === e.cocktailId);
            return (
              <Link key={`${e.cocktailId}-${e.at}-${i}`} href={`/cocktail/${e.cocktailId}`} asChild>
                <View style={[styles.row, { borderBottomColor: c.color.border }]}>
                  <Text style={{ color: c.color.text, fontSize: 16, flex: 1 }}>{ck?.name ?? e.cocktailId}</Text>
                  <Text style={{ color: c.color.textDim }}>{timeStr(e.at)}</Text>
                </View>
              </Link>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  date: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
});
