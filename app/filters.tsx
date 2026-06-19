import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Chip } from "@/components/Chip";
import { TAG_GROUPS } from "@/data/catalog/taxonomy";
import { getAllCocktails } from "@/data/cocktails";
import { applyFilters } from "@/domain/cocktails";
import { useT } from "@/i18n";
import { useFilterStore } from "@/store/filterStore";
import { useTheme } from "@/theme/theme";

export default function FiltersScreen() {
  const c = useTheme();
  const t = useT();
  const router = useRouter();
  const { tags, toggleTag, clear } = useFilterStore();
  const count = applyFilters(getAllCocktails(), { tags }).length;

  return (
    <View style={{ flex: 1, backgroundColor: c.color.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
        {TAG_GROUPS.map((g) => (
          <View key={g.key} style={{ marginBottom: 18 }}>
            <Text style={[styles.group, { color: c.color.gold }]}>{g.labelUk}</Text>
            <View style={styles.wrap}>
              {g.tags.map((tag) => (
                <Chip key={tag} label={tag} selected={tags.includes(tag)} onPress={() => toggleTag(tag)} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={[styles.footer, { backgroundColor: c.color.surface, borderTopColor: c.color.border }]}>
        <Pressable onPress={clear} hitSlop={10}>
          <Text style={{ color: c.color.textDim, fontSize: 15 }}>{t.common.clear}</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={[styles.cta, { backgroundColor: c.color.gold }]}>
          <Text style={{ color: c.color.bg, fontWeight: "700" }}>{count} коктейлів</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  wrap: { flexDirection: "row", flexWrap: "wrap" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  cta: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 999 },
});
