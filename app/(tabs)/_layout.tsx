import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { Pressable, Text } from "react-native";
import { useT } from "@/i18n";
import { useTheme } from "@/theme/theme";

const icon = (glyph: string) => {
  const TabBarIcon = ({ color }: { color: string }) => <Text style={{ fontSize: 18, color }}>{glyph}</Text>;
  return TabBarIcon;
};

function SettingsButton() {
  const router = useRouter();
  const c = useTheme();
  return (
    <Pressable onPress={() => router.push("/settings")} hitSlop={10} style={{ paddingHorizontal: 14 }}>
      <MaterialCommunityIcons name="cog-outline" size={22} color={c.color.text} />
    </Pressable>
  );
}

export default function TabsLayout() {
  const c = useTheme();
  const t = useT();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: c.color.bg },
        headerTintColor: c.color.text,
        headerTitleStyle: { color: c.color.text },
        sceneStyle: { backgroundColor: c.color.bg },
        tabBarStyle: { backgroundColor: c.color.surface, borderTopColor: c.color.border },
        tabBarActiveTintColor: c.color.gold,
        tabBarInactiveTintColor: c.color.textDim,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t.tabs.collection, tabBarIcon: icon("🍸"), headerRight: () => <SettingsButton /> }}
      />
      <Tabs.Screen name="sets" options={{ title: t.sets.tab, tabBarIcon: icon("🎉") }} />
      <Tabs.Screen name="bar" options={{ title: t.tabs.bar, tabBarIcon: icon("🧰") }} />
      <Tabs.Screen name="shopping" options={{ title: t.tabs.shopping, tabBarIcon: icon("🛒") }} />
      <Tabs.Screen name="favourites" options={{ title: t.tabs.favourites, tabBarIcon: icon("♥") }} />
    </Tabs>
  );
}
