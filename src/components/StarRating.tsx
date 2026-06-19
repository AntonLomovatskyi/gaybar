import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/theme";

export function StarRating({
  value,
  onChange,
  size = 24,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  const c = useTheme();
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          onPress={onChange ? () => onChange(n === value ? 0 : n) : undefined}
          disabled={!onChange}
          hitSlop={6}
        >
          <Text style={{ fontSize: size, color: n <= value ? c.color.gold : c.color.textFaint }}>
            {n <= value ? "★" : "☆"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: "row", gap: 4 } });
