import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import type { Cocktail } from "@/types/cocktail";
import { getCardImages } from "@/data/cocktails";
import { useTheme } from "@/theme/theme";
import { useUserStore } from "@/store/userStore";
import { GRID_GAP, useGridColumns } from "./grid";

export function CocktailCard({ cocktail }: { cocktail: Cocktail }) {
  const c = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const columns = useGridColumns();
  // explicit width: list content padding (GRID_GAP each side) + per-card margins (GRID_GAP each side)
  const cardW = Math.floor((width - GRID_GAP * 2) / columns) - GRID_GAP * 2;

  const img = getCardImages(cocktail.id);
  const isFav = useUserStore((s) => s.favourites.includes(cocktail.id));
  const toggleFav = useUserStore((s) => s.toggleFavourite);
  const strength = cocktail.tags.find((t) => t === "міцні" || t === "слабоалкогольні" || t === "безалкогольні");

  return (
    <Pressable
      onPress={() => router.push(`/cocktail/${cocktail.id}`)}
      style={[styles.card, { width: cardW, backgroundColor: c.color.surface, borderColor: c.color.border }]}
    >
      <View style={styles.imageWrap}>
        {img?.front ? (
          <Image source={img.front} style={styles.image} contentFit="cover" transition={150} />
        ) : (
          <View style={[styles.image, { backgroundColor: c.color.surfaceAlt }]} />
        )}
        <Pressable onPress={() => toggleFav(cocktail.id)} hitSlop={8} style={styles.heart}>
          <Text style={{ fontSize: 18, color: isFav ? c.color.gold : c.color.text }}>{isFav ? "♥" : "♡"}</Text>
        </Pressable>
      </View>
      <Text style={[styles.name, { color: c.color.text }]} numberOfLines={1}>
        {cocktail.name}
      </Text>
      {strength ? (
        <Text style={[styles.meta, { color: c.color.textDim }]} numberOfLines={1}>
          {strength}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { margin: GRID_GAP, borderRadius: 12, borderWidth: 1, padding: 6, overflow: "hidden" },
  imageWrap: { width: "100%", aspectRatio: 0.72, borderRadius: 8, overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  heart: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { marginTop: 6, fontSize: 13, fontWeight: "600" },
  meta: { marginTop: 1, fontSize: 11 },
});
