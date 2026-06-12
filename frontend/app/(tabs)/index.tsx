import { FlatList, ListRenderItem, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import EditScreenInfo from "@/components/expo/EditScreenInfo";
import { Text, View } from "@/components/expo/Themed";
import { PostCard } from "@/components/main/PostCard";
import { POSTS } from "@/mocks/posts";
import { Post } from "@/types";

const renderPost: ListRenderItem<Post> = ({ item }) => {
  return <PostCard post={item} />;
};

export default function TabOneScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container]}>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={POSTS}
        renderItem={renderPost}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
