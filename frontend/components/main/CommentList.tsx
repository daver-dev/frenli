import { POSTS } from "@/mocks/posts";
import { Comment } from "@/types";
import {
  FlatList,
  Image,
  ListRenderItem,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Text, useThemeColor } from "../expo/Themed";
import { getComments, getReplies } from "@/mocks/comments";
import { useEffect, useRef, useState } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Octicons from "@expo/vector-icons/Octicons";
import { useLoggedInUser } from "@/context/LoggedInUserContext";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";

export type CommentListProps = {
  postId: string;
};
export type CommentProps = {
  comment: Comment;
  topLevelCommentId: string;
  onReplyPress: (topLevelCommentId: string, username: string) => void;
  onPendingReplyConsumed: () => void;
  pendingReply?: Comment | null;
};
type ReplyingTo = {
  parentCommentId: string;
  username: string;
};

const CommentItem = (props: CommentProps) => {
  const {
    comment,
    topLevelCommentId,
    onReplyPress,
    onPendingReplyConsumed,
    pendingReply,
  } = props;

  const themeTextColor = useThemeColor({}, "text");
  const grayTextColor = useThemeColor(
    { light: "#4c4c4c", dark: "#a4a4a4" },
    "text",
  );
  const heartScale = useSharedValue(1);
  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

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

  // When there is a pending reply, this will check which comment to apply it to.
  useEffect(() => {
    if (pendingReply && pendingReply.parentCommentId === topLevelCommentId) {
      setReplies((prev) => [...prev, pendingReply]);
      setShowingReplies(true);
      onPendingReplyConsumed();
    }
  }, [pendingReply]);

  const renderReply: ListRenderItem<Comment> = ({ item }) => {
    return (
      <CommentItem
        comment={item}
        topLevelCommentId={topLevelCommentId}
        onReplyPress={onReplyPress}
        // The below prop doesnt do anything here, it was just safer to make it required
        onPendingReplyConsumed={onPendingReplyConsumed}
      />
    );
  };

  const CommentOrReply = () => {
    return (
      <View style={styles.commentPartsContainer}>
        <Image
          source={{ uri: comment.authorAvatarUrl }}
          style={styles.avatar}
        />
        <View style={styles.commentText}>
          <Text style={styles.commenterNameText}>{comment.authorUsername}</Text>
          <Text>{comment.text}</Text>
          <Pressable
            onPress={() => {
              onReplyPress(topLevelCommentId, comment.authorUsername);
            }}
          >
            <Text style={[styles.replyButton, { color: grayTextColor }]}>
              Reply
            </Text>
          </Pressable>
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
          renderItem={renderReply}
          style={{ paddingLeft: 50, paddingTop: 4 }}
          contentContainerStyle={
            (styles.commentListContainer, { paddingLeft: 30 })
          }
          keyboardShouldPersistTaps="handled"
        />
      ) : null}
      {replies.length ? (
        <Pressable
          onPress={() => {
            setShowingReplies(!showingReplies);
          }}
        >
          <Text
            style={[styles.showCommentRepliesButton, { color: grayTextColor }]}
          >
            {showingReplies
              ? "- Hide Replies"
              : `- Show Replies (${replies.length})`}
          </Text>
        </Pressable>
      ) : (
        <></>
      )}
    </View>
  );
};

export const CommentList = (props: CommentListProps) => {
  const themeTextColor = useThemeColor({}, "text");
  const grayBgColor = useThemeColor(
    { light: "#bebebe", dark: "#4a4a4a" },
    "background",
  );

  const [currentComments, setCurrentComments] = useState<Comment[] | null>(
    null,
  );
  const [addCommentText, setAddCommentText] = useState<string>("");
  const [commentBeingRepliedTo, setCommentBeingRepliedTo] =
    useState<ReplyingTo | null>(null);
  const [pendingReply, setPendingReply] = useState<Comment | null>(null);

  const { loggedInUser } = useLoggedInUser();
  const commentInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const loadComments = async () => {
      const page = await getComments(props.postId);
      setCurrentComments(page.items);
    };
    loadComments();
  }, [props.postId]);

  const replyToComment = (topLevelCommentId: string, username: string) => {
    setCommentBeingRepliedTo({ parentCommentId: topLevelCommentId, username });
    setAddCommentText(`@${username} `);
    commentInputRef.current?.focus();
  };

  const cancelReplyToComment = () => {
    setCommentBeingRepliedTo(null);
    setAddCommentText("");
  };

  const handlePendingReplyConsumed = () => setPendingReply(null);

  const renderTopLevelComment: ListRenderItem<Comment> = ({ item }) => {
    return (
      <CommentItem
        comment={item}
        topLevelCommentId={item.id}
        onReplyPress={replyToComment}
        pendingReply={pendingReply}
        onPendingReplyConsumed={handlePendingReplyConsumed}
      />
    );
  };

  const handleSubmitComment = () => {
    if (!addCommentText.trim() || !loggedInUser) {
      return;
    }
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      postId: props.postId,
      authorId: loggedInUser.id,
      authorUsername: loggedInUser.username,
      authorAvatarUrl: loggedInUser.avatarUrl,
      text: addCommentText,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      replyCount: 0,
      parentCommentId: commentBeingRepliedTo?.parentCommentId,
    };
    if (commentBeingRepliedTo) {
      setPendingReply(newComment);
    } else {
      setCurrentComments((prev) => [...(prev ?? []), newComment]);
    }
    setCommentBeingRepliedTo(null);
    setAddCommentText("");
  };

  return (
    <View style={{ gap: 12, padding: 8, flex: 1 }}>
      <Text style={styles.commentsTitle}>Comments</Text>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={currentComments}
        renderItem={renderTopLevelComment}
        contentContainerStyle={styles.commentListContainer}
        keyboardShouldPersistTaps="handled"
      />
      {currentComments?.length == 0 ? (
        <Text style={{ textAlign: "center" }}>No comments yet!</Text>
      ) : null}
      {commentBeingRepliedTo ? (
        <View style={[styles.replyingToBar, { backgroundColor: grayBgColor }]}>
          <Text style={{ flex: 1 }}>
            Replying to @{commentBeingRepliedTo.username}
          </Text>
          <Pressable onPress={cancelReplyToComment}>
            <Octicons name="x" size={24} style={{ color: themeTextColor }} />
          </Pressable>
        </View>
      ) : null}
      <View style={styles.addCommentBar}>
        <Image
          style={styles.avatar}
          source={{ uri: loggedInUser?.avatarUrl }}
        />

        <View style={[styles.commentTextBox, { outlineColor: themeTextColor }]}>
          {Platform.OS === "web" ? (
            <TextInput
              style={{
                outlineStyle: "none" as any,
                flex: 1,
                color: themeTextColor,
              }}
              value={addCommentText}
              onChangeText={(text) => {
                setAddCommentText(text);
              }}
              onSubmitEditing={handleSubmitComment}
              ref={commentInputRef}
              placeholder="Add a comment..."
            />
          ) : (
            <BottomSheetTextInput
              onChangeText={(text) => {
                setAddCommentText(text);
              }}
              value={addCommentText}
              onSubmitEditing={handleSubmitComment}
              style={{ flex: 1, color: themeTextColor }}
              ref={commentInputRef as any}
              placeholder="Add a comment..."
            />
          )}
          {addCommentText.length ? (
            <Pressable
              style={styles.submitCommentButton}
              onPress={handleSubmitComment}
            >
              <Octicons
                size={29}
                name="arrow-up"
                style={{ color: "#ffffff" }}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export const styles = StyleSheet.create({
  commentListContainer: { gap: 6, flex: 1 },
  commentPartsContainer: {
    padding: 2,
    flexDirection: "row",
    gap: 4,
  },
  commentsTitle: { fontSize: 18, alignSelf: "center" },
  commentText: { flex: 6, paddingHorizontal: 8, gap: 4 },
  commenterNameText: { fontWeight: "bold" },
  avatar: {
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
  showCommentRepliesButton: {
    paddingLeft: 70,
    paddingVertical: 4,
    fontWeight: 500,
    fontSize: 13,
  },
  replyButton: {
    paddingVertical: 4,
    fontWeight: 500,
    fontSize: 13,
  },
  addCommentBar: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  commentTextBox: {
    outlineStyle: "solid",
    outlineWidth: 1,
    marginHorizontal: 10,
    paddingLeft: 10,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  submitCommentButton: {
    backgroundColor: "#32a338",
    borderRadius: 16,
    width: 40,
    marginRight: 3,
    alignItems: "center",
  },
  replyingToBar: {
    flexDirection: "row",
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
  },
});
