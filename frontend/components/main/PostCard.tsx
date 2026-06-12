import { Image, Pressable, StyleSheet } from "react-native";
import { Post } from "@/types";
import { Text, useThemeColor, View } from "../expo/Themed";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

type PostCardProps = { post: Post };

export const PostCard = (props: PostCardProps) => {
  const { post } = props;
  const [isLiked, setIsLiked] = useState(false);
  const themeTextColor = useThemeColor({}, "text");
  const heartScale = useSharedValue(1);
  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  return (
    <>
      <View style={styles.container}>
        <View style={styles.titleBar}>
          <Image
            source={{ uri: post.authorAvatarUrl }}
            style={styles.avatarImage}
          />
          <Text style={styles.username}>{post.authorUsername}</Text>
        </View>
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
        <View style={styles.bottomBar}>
          <Octicons></Octicons>
          <Animated.View style={heartAnimatedStyle}>
            <Pressable
              onPress={() => {
                setIsLiked(!isLiked);
                heartScale.value = withSequence(
                  withTiming(0.8, { duration: 130 }),
                  withTiming(1.1, { duration: 80 }),
                  withTiming(1, { duration: 80 }),
                );
              }}
            >
              <Octicons
                name={isLiked ? "heart-fill" : "heart"}
                size={25}
                color={isLiked ? "red" : themeTextColor}
              />
            </Pressable>
          </Animated.View>
          <Text>{post.likeCount}</Text>
          <Octicons
            name="comment"
            size={25}
            color={useThemeColor({}, "text")}
          />
          <Text>{post.commentCount}</Text>
        </View>
        <View style={styles.caption}>
          <Text style={styles.username}>{post.authorUsername}</Text>
          <Text style={styles.caption}>{post.caption}</Text>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: 500,
    width: "100%",
    gap: 10,
    padding: 8,
    alignSelf: "center",
  },
  titleBar: {
    flexDirection: "row",
    width: "100%",
    paddingLeft: 10,
    gap: 10,
    alignItems: "center",
  },
  bottomBar: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
    alignItems: "center",
  },
  avatarImage: { width: 36, height: 36, borderRadius: 36 },
  postImage: {
    aspectRatio: 1,
    borderRadius: 10,
  },
  caption: {
    paddingLeft: 10,
    flexDirection: "row",
  },
  username: {
    fontWeight: 700,
  },
});
