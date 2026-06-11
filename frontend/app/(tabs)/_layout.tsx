import { Link, Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable } from "react-native";

import { useClientOnlyValue } from "@/components/expo/useClientOnlyValue";
import { useColorScheme } from "@/components/expo/useColorScheme";
import Colors from "@/constants/Colors";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarShowLabel: false,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="home" size={25} color={color} />
          ),
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable style={{ marginRight: 15 }}>
                {({ pressed }) => (
                  <SymbolView
                    name={{ ios: "info.circle", android: "info", web: "info" }}
                    size={25}
                    tintColor={Colors[colorScheme].text}
                    style={{ opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="send" size={25} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
