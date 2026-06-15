import { POSTS } from "@/mocks/posts";
import { Comment } from "@/types";
import {
  FlatList,
  Image,
  ListRenderItem,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Text, useThemeColor } from "../expo/Themed";
import { getComments } from "@/mocks/comments";
import { useEffect, useState } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Octicons from "@expo/vector-icons/Octicons";

export type CommentListProps = {
  postId: string;
};
export type CommentProps = {
  comment: Comment;
};

const renderComment: ListRenderItem<Comment> = ({ item }) => {
  return <CommentItem comment={item} />;
};

const CommentItem = (props: CommentProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const themeTextColor = useThemeColor({}, "text");
  const heartScale = useSharedValue(1);
  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  return (
    <View style={styles.commentPartsContainer}>
      <Image
        source={{ uri: props.comment.authorAvatarUrl }}
        style={styles.commenterAvatar}
      />
      <View style={styles.commentText}>
        <Text style={styles.commenterNameText}>
          {props.comment.authorUsername}
        </Text>
        <Text>{props.comment.text}</Text>
      </View>
      <View style={styles.commentLikesContainer}>
        <Animated.View style={heartAnimatedStyle}>
          <Pressable
            hitSlop={4}
            onPress={() => {
              setIsLiked(!isLiked);
              heartScale.value = withSequence(
                withTiming(0.8, { duration: 130 }),
                withTiming(1.1, { duration: 80 }),
                withTiming(1, { duration: 80 }),
              );
            }}
          >
            <View style={{ gap: 4 }}>
              <Octicons
                name={isLiked ? "heart-fill" : "heart"}
                size={12}
                color={isLiked ? "red" : themeTextColor}
              />
              <Text style={{ alignSelf: "center" }}>
                {props.comment.likeCount}
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};

export const CommentList = (props: CommentListProps) => {
  const [currentComments, setCurrentComments] = useState<Comment[]>([]);
  useEffect(() => {
    const loadComments = async () => {
      const page = await getComments(props.postId);
      setCurrentComments(page.items);
    };
    loadComments();
  }, [props.postId]);

  return (
    <View style={{ gap: 12, padding: 8 }}>
      <Text style={styles.commentsTitle}>Comments</Text>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={currentComments}
        renderItem={renderComment}
        contentContainerStyle={styles.commentListContainer}
      />
    </View>
  );
};

export const styles = StyleSheet.create({
  commentListContainer: { gap: 6 },
  commentPartsContainer: {
    padding: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  commentsTitle: { fontSize: 18, alignSelf: "center" },
  commentText: { flex: 6, paddingHorizontal: 8, gap: 2 },
  commenterNameText: { fontWeight: "bold" },
  commenterAvatar: {
    width: 42,
    height: 42,
    borderRadius: 42,
  },
  commentLikesContainer: {
    flex: 1,
    alignItems: "flex-end",
    paddingRight: 8,
    paddingTop: 8,
  },
  grayText: {},
});
