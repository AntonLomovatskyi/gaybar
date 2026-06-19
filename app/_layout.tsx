import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useTheme } from "@/theme/theme";

export default function RootLayout() {
  const c = useTheme();
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.color.bg },
          headerTintColor: c.color.gold,
          headerTitleStyle: { color: c.color.text },
          headerBackButtonDisplayMode: "minimal",
          headerBackTitle: "",
          contentStyle: { backgroundColor: c.color.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="filters" options={{ presentation: "modal", title: "Фільтри" }} />
      </Stack>
    </SafeAreaProvider>
  );
}
