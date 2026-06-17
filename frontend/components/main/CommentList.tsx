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
import { getComments, getReplies } from "@/mocks/comments";
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
  const { comment } = props;
  const [isLiked, setIsLiked] = useState(false);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [showingReplies, setShowingReplies] = useState<boolean>(false);
  useEffect(() => {
    const loadReplies = async () => {
      const initialRepliesPage = await getReplies(comment.postId, comment.id);
      setReplies(initialRepliesPage.items);
    };
    loadReplies();
  }, [comment.postId, comment.id]);

  const themeTextColor = useThemeColor({}, "text");
  const grayTextColor = useThemeColor(
    { light: "#4c4c4c", dark: "#a4a4a4" },
    "text",
  );
  const heartScale = useSharedValue(1);
  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const CommentOrReply = () => {
    return (
      <View style={styles.commentPartsContainer}>
        <Image
          source={{ uri: comment.authorAvatarUrl }}
          style={styles.commenterAvatar}
        />
        <View style={styles.commentText}>
          <Text style={styles.commenterNameText}>{comment.authorUsername}</Text>
          <Text>{comment.text}</Text>
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
                <Text style={{ alignSelf: "center" }}>{comment.likeCount}</Text>
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  };

  return (
    <View>
      <CommentOrReply />
      {showingReplies ? (
        <FlatList
          showsVerticalScrollIndicator={false}
          data={replies}
          renderItem={renderComment}
          style={{ paddingLeft: 50 }}
          contentContainerStyle={
            (styles.commentListContainer, { paddingLeft: 30 })
          }
        />
      ) : (
        <></>
      )}
      {replies.length ? (
        <Pressable
          onPress={() => {
            setShowingReplies(!showingReplies);
          }}
        >
          <Text style={[styles.commentRepliesButton, { color: grayTextColor }]}>
            {showingReplies
              ? "- Hide Replies"
              : `- Show Replies (${comment.replyCount})`}
          </Text>
        </Pressable>
      ) : (
        <></>
      )}
    </View>
  );
};

export const CommentList = (props: CommentListProps) => {
  const [currentComments, setCurrentComments] = useState<Comment[] | null>(
    null,
  );
  useEffect(() => {
    const loadComments = async () => {
      const page = await getComments(props.postId);
      setCurrentComments(page.items);
    };
    loadComments();
  }, [props.postId]);
  const themeTextColor = useThemeColor({}, "text");

  return (
    <View style={{ gap: 12, padding: 8, flex: 1 }}>
      <Text style={styles.commentsTitle}>Comments</Text>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={currentComments}
        renderItem={renderComment}
        contentContainerStyle={styles.commentListContainer}
      />
      {currentComments?.length == 0 ? (
        <Text style={{ textAlign: "center" }}>No comments yet!</Text>
      ) : (
        <></>
      )}
      <View style={[styles.commentTextBox, { outlineColor: themeTextColor }]}>
        <Text>yo</Text>
      </View>
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
    width: 36,
    height: 36,
    borderRadius: 36,
  },
  commentLikesContainer: {
    flex: 1,
    alignItems: "flex-end",
    paddingRight: 8,
    paddingTop: 8,
  },
  commentRepliesButton: {
    paddingLeft: 50,
    paddingVertical: 4,
    fontWeight: 500,
    fontSize: 13,
  },
  commentTextBox: { outlineStyle: "solid", outlineWidth: 1 },
});
