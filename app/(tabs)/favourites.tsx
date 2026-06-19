import { FlatList, StyleSheet, Text, View } from "react-native";
import { CocktailCard } from "@/components/CocktailCard";
import { useGridColumns } from "@/components/grid";
import { useAllCocktails } from "@/data/useCocktails";
import { useT } from "@/i18n";
import { useUserStore } from "@/store/userStore";
import { useTheme } from "@/theme/theme";

export default function FavouritesScreen() {
  const c = useTheme();
  const t = useT();
  const columns = useGridColumns();
  const favs = useUserStore((s) => s.favourites);
  const list = useAllCocktails().filter((x) => favs.includes(x.id));

  if (!list.length) {
    return (
      <View style={styles.center}>
        <Text style={{ color: c.color.textDim, textAlign: "center", paddingHorizontal: 32 }}>{t.favourites.empty}</Text>
      </View>
    );
  }
  return (
    <FlatList
      key={`grid-${columns}`}
      data={list}
      keyExtractor={(item) => item.id}
      numColumns={columns}
      contentContainerStyle={{ padding: 6, paddingBottom: 24 }}
      renderItem={({ item }) => <CocktailCard cocktail={item} />}
    />
  );
}

const styles = StyleSheet.create({ center: { flex: 1, alignItems: "center", justifyContent: "center" } });
