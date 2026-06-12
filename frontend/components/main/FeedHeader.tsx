import { Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { Text, View, useThemeColor } from "@/components/expo/Themed";

export function FeedHeader() {
  const insets = useSafeAreaInsets();
  const textColor = useThemeColor({}, "text");

  return (
    <View style={{ paddingTop: insets.top }}>
      <View style={styles.row}>
        <Text style={styles.title}>Frenli</Text>
        <Pressable hitSlop={10} onPress={() => {}}>
          <FontAwesome name="search" size={22} color={textColor} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    maxWidth: 500,
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    paddingLeft: 6,
  },
});
