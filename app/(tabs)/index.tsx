import { Link, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { CocktailCard } from "@/components/CocktailCard";
import { useGridColumns } from "@/components/grid";
import { MOODS } from "@/data/catalog/moods";
import { useAllCocktails } from "@/data/useCocktails";
import { applyFilters, pickSurprise, sortBy, type SortMode } from "@/domain/cocktails";
import { recommendForYou } from "@/domain/recommend";
import { useT } from "@/i18n";
import { useFilterStore } from "@/store/filterStore";
import { useUserStore } from "@/store/userStore";
import { useTheme } from "@/theme/theme";

const SORTS: SortMode[] = ["card", "name", "strength", "ingredients"];

export default function CollectionScreen() {
  const c = useTheme();
  const t = useT();
  const router = useRouter();
  const all = useAllCocktails();
  const [query, setQuery] = useState("");
  const { tags, sort, setTags, setSort } = useFilterStore();

  const favourites = useUserStore((s) => s.favourites);
  const ratings = useUserStore((s) => s.ratings);
  const prefs = useUserStore((s) => s.prefs);

  const columns = useGridColumns();
  const list = useMemo(() => sortBy(applyFilters(all, { tags, query }), sort), [all, tags, query, sort]);
  const isHome = !query.trim() && tags.length === 0;
  const cotd = useMemo(() => pickSurprise(all, Math.floor(Date.now() / 86400000)), [all]);
  const recs = useMemo(
    () => recommendForYou(all, { favourites, ratings, likedTags: prefs.likedTags, dislikedTags: prefs.dislikedTags }),
    [all, favourites, ratings, prefs],
  );
  const cycleSort = () => setSort(SORTS[(SORTS.indexOf(sort) + 1) % SORTS.length]);
  const surprise = () => {
    const pick = pickSurprise(list.length ? list : all, Date.now());
    if (pick) router.push(`/cocktail/${pick.id}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.color.bg }}>
      <View style={styles.toolbar}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t.common.searchPlaceholder}
          placeholderTextColor={c.color.textFaint}
          style={[
            styles.search,
            { backgroundColor: c.color.surfaceAlt, color: c.color.text, borderColor: c.color.border },
          ]}
        />
      </View>
      <View style={styles.actions}>
        <Link href="/filters" asChild>
          <Pressable style={[styles.action, { borderColor: tags.length ? c.color.gold : c.color.border }]}>
            <Text style={{ color: tags.length ? c.color.gold : c.color.textDim }}>
              ⚙ {t.common.filters}
              {tags.length ? ` (${tags.length})` : ""}
            </Text>
          </Pressable>
        </Link>
        <Pressable style={[styles.action, { borderColor: c.color.border }]} onPress={cycleSort}>
          <Text style={{ color: c.color.textDim }}>↕ {t.sort[sort]}</Text>
        </Pressable>
        <Pressable style={[styles.action, { borderColor: c.color.gold }]} onPress={surprise}>
          <Text style={{ color: c.color.gold }}>🎲 {t.common.surprise}</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.moods}
        contentContainerStyle={{ paddingHorizontal: 8, alignItems: "center" }}
      >
        {MOODS.map((m) => {
          const active = m.tags.every((x) => tags.includes(x)) && tags.length === m.tags.length;
          return (
            <Pressable
              key={m.key}
              onPress={() => setTags(active ? [] : m.tags)}
              style={[
                styles.mood,
                {
                  backgroundColor: active ? c.color.goldDim : c.color.surface,
                  borderColor: active ? c.color.gold : c.color.border,
                },
              ]}
            >
              <Text style={{ color: c.color.text }}>
                {m.emoji} {m.labelUk}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isHome && cotd ? (
        <Pressable
          onPress={() => router.push(`/cocktail/${cotd.id}`)}
          style={[styles.cotd, { borderColor: c.color.gold, backgroundColor: c.color.surface }]}
        >
          <Text style={{ color: c.color.gold, fontSize: 13, fontWeight: "700" }}>🍸 {t.home.cocktailOfDay}</Text>
          <Text style={{ color: c.color.text, fontSize: 16, marginTop: 2 }}>{cotd.name}</Text>
        </Pressable>
      ) : null}

      {isHome && recs.length ? (
        <View>
          <Text style={[styles.section, { color: c.color.gold }]}>✨ {t.home.forYou}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 6 }}
            style={{ flexGrow: 0 }}
          >
            {recs.slice(0, 12).map((r) => (
              <View key={r.id} style={{ width: 130 }}>
                <CocktailCard cocktail={r} />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <Text style={[styles.count, { color: c.color.textFaint }]}>{list.length} коктейлів</Text>

      <FlatList
        key={`grid-${columns}`}
        data={list}
        keyExtractor={(item) => item.id}
        numColumns={columns}
        contentContainerStyle={{ padding: 6, paddingBottom: 24 }}
        renderItem={({ item }) => <CocktailCard cocktail={item} />}
        ListEmptyComponent={<Text style={[styles.empty, { color: c.color.textDim }]}>{t.common.none}</Text>}
        removeClippedSubviews={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: { paddingHorizontal: 12, paddingTop: 8 },
  search: { height: 42, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },
  actions: { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingTop: 10 },
  action: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  moods: { marginTop: 10, height: 48, flexGrow: 0 },
  mood: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8 },
  count: { paddingHorizontal: 14, paddingVertical: 8, fontSize: 12 },
  cotd: { marginHorizontal: 12, marginTop: 12, borderWidth: 1, borderRadius: 12, padding: 12 },
  section: { paddingHorizontal: 14, marginTop: 14, marginBottom: 2, fontSize: 14, fontWeight: "700" },
  empty: { textAlign: "center", marginTop: 40 },
});
