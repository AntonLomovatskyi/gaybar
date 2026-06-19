import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/theme";

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const c = useTheme();
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        style={[styles.btn, { borderColor: c.color.border }]}
      >
        <Text style={{ color: c.color.text, fontSize: 18 }}>−</Text>
      </Pressable>
      <Text style={{ color: c.color.text, minWidth: 26, textAlign: "center", fontSize: 16 }}>{value}</Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        style={[styles.btn, { borderColor: c.color.border }]}
      >
        <Text style={{ color: c.color.text, fontSize: 18 }}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  btn: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
