import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Chip } from "@/components/Chip";
import { StarRating } from "@/components/StarRating";
import { Stepper } from "@/components/Stepper";
import { ToolChip } from "@/components/ToolChip";
import { getCardImages } from "@/data/cocktails";
import { useCocktailById } from "@/data/useCocktails";
import { formatIngredient } from "@/domain/cocktails";
import { useT } from "@/i18n";
import { useUserStore } from "@/store/userStore";
import { useTheme } from "@/theme/theme";

export default function CocktailDetail() {
  const c = useTheme();
  const t = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const cocktail = useCocktailById(id);
  const img = id ? getCardImages(id) : undefined;
  const [showBack, setShowBack] = useState(false);
  const [servings, setServings] = useState(1);

  const rating = useUserStore((s) => (id ? (s.ratings[id] ?? 0) : 0));
  const setRating = useUserStore((s) => s.setRating);
  const isFav = useUserStore((s) => (id ? s.favourites.includes(id) : false));
  const toggleFav = useUserStore((s) => s.toggleFavourite);
  const setShopping = useUserStore((s) => s.setShoppingServings);
  const shoppingNow = useUserStore((s) => (id ? (s.shopping[id] ?? 0) : 0));
  const units = useUserStore((s) => s.units);
  const removeUserRecipe = useUserStore((s) => s.removeUserRecipe);
  const isUserRecipe = useUserStore((s) => (id ? s.userRecipes.some((r) => r.id === id) : false));

  if (!cocktail || !id) {
    return (
      <View style={styles.center}>
        <Text style={{ color: c.color.textDim }}>Коктейль не знайдено</Text>
      </View>
    );
  }

  const source = showBack && img?.back ? img.back : img?.front;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.color.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Stack.Screen
        options={{
          title: cocktail.name,
          headerRight: () => (
            <Pressable onPress={() => toggleFav(id)} hitSlop={12}>
              <Text style={{ fontSize: 22, color: isFav ? c.color.gold : c.color.text }}>{isFav ? "♥" : "♡"}</Text>
            </Pressable>
          ),
        }}
      />

      <Pressable onPress={() => img?.back && setShowBack((v) => !v)} style={styles.hero}>
        {source ? <Image source={source} style={styles.heroImg} contentFit="contain" transition={150} /> : null}
        {img?.back ? (
          <Text style={[styles.flip, { color: c.color.textFaint }]}>{showBack ? "↩ лицьова" : "↪ зворот"}</Text>
        ) : null}
      </Pressable>

      <View style={styles.tags}>
        {cocktail.tags.map((tag) => (
          <Chip key={tag} label={tag} />
        ))}
      </View>

      <View style={styles.rateRow}>
        <Text style={[styles.rateLabel, { color: c.color.textDim }]}>{t.recipe.rate}</Text>
        <StarRating value={rating} onChange={(v) => setRating(id, v)} />
      </View>

      <Section title={t.recipe.ingredients} c={c}>
        <View style={styles.scaleRow}>
          <Text style={{ color: c.color.textDim, fontSize: 14 }}>Порцій</Text>
          <Stepper value={servings} onChange={setServings} min={1} max={20} />
        </View>
        {cocktail.ingredients.map((ing, i) => (
          <Text key={i} style={[styles.line, { color: c.color.text }]}>
            • {formatIngredient(ing, servings, units)}
          </Text>
        ))}
      </Section>

      <Section title={t.recipe.tools} c={c}>
        <View style={styles.chips}>
          {cocktail.tools.map((tool, i) => (
            <ToolChip key={`${tool}-${i}`} name={tool} />
          ))}
          {cocktail.glass && !cocktail.tools.includes(cocktail.glass) ? <ToolChip name={cocktail.glass} /> : null}
        </View>
      </Section>

      <Section title={t.recipe.steps} c={c}>
        {cocktail.steps.map((s, i) => (
          <Text key={i} style={[styles.line, { color: c.color.text, marginBottom: 6 }]}>
            {i + 1}. {s}
          </Text>
        ))}
      </Section>

      <Pressable
        style={[styles.cta, { backgroundColor: c.color.gold }]}
        onPress={() => router.push(`/cocktail/${id}/make`)}
      >
        <Text style={{ color: c.color.bg, fontWeight: "700", fontSize: 16 }}>▶ {t.recipe.start}</Text>
      </Pressable>
      <Pressable
        style={[styles.ctaGhost, { borderColor: c.color.border }]}
        onPress={() => {
          setShopping(id, shoppingNow + 1);
          Alert.alert(cocktail.name, `${t.recipe.addToShopping} ✓ (${shoppingNow + 1})`);
        }}
      >
        <Text style={{ color: c.color.text, fontSize: 15 }}>🛒 {t.recipe.addToShopping}</Text>
      </Pressable>

      {isUserRecipe ? (
        <View style={styles.userActions}>
          <Pressable
            style={[styles.ctaGhost, { borderColor: c.color.border, flex: 1 }]}
            onPress={() => router.push(`/recipe/new?edit=${id}`)}
          >
            <Text style={{ color: c.color.text }}>✎ Редагувати</Text>
          </Pressable>
          <Pressable
            style={[styles.ctaGhost, { borderColor: c.color.danger, flex: 1 }]}
            onPress={() =>
              Alert.alert("Видалити рецепт?", cocktail.name, [
                { text: "Скасувати", style: "cancel" },
                {
                  text: "Видалити",
                  style: "destructive",
                  onPress: () => {
                    removeUserRecipe(id);
                    router.back();
                  },
                },
              ])
            }
          >
            <Text style={{ color: c.color.danger }}>🗑 Видалити</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

function Section({ title, c, children }: { title: string; c: ReturnType<typeof useTheme>; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 22 }}>
      <Text style={[styles.section, { color: c.color.gold, borderBottomColor: c.color.border }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { alignItems: "center" },
  heroImg: { width: "70%", aspectRatio: 0.72, borderRadius: 14 },
  flip: { marginTop: 6, fontSize: 12 },
  tags: { flexDirection: "row", flexWrap: "wrap", marginTop: 16 },
  chips: { flexDirection: "row", flexWrap: "wrap" },
  scaleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  rateRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  rateLabel: { fontSize: 14 },
  section: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingBottom: 6,
    marginBottom: 10,
    borderBottomWidth: 1,
  },
  line: { fontSize: 16, lineHeight: 24 },
  cta: { marginTop: 28, paddingVertical: 15, borderRadius: 12, alignItems: "center" },
  ctaGhost: { marginTop: 12, paddingVertical: 14, borderRadius: 12, alignItems: "center", borderWidth: 1 },
  userActions: { flexDirection: "row", gap: 12, marginTop: 12 },
});
