import { POSTS } from "@/mocks/posts";
import { Comment } from "@/types";
import {
  FlatList,
  Image,
  ListRenderItem,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "../expo/Themed";
import { getComments } from "@/mocks/comments";
import { useEffect, useState } from "react";

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
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: props.comment.authorAvatarUrl }}
        style={styles.commenterAvatar}
      />
      <View>
        <Text>{props.comment.authorUsername}</Text>
        <Text>{props.comment.text}</Text>
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
    <View style={{ gap: 8, padding: 8 }}>
      <Text style={styles.commentsTitle}>Comments</Text>
      <View style={[styles.container]}>
        <FlatList
          showsVerticalScrollIndicator={false}
          data={currentComments}
          renderItem={renderComment}
        />
      </View>
    </View>
  );
};

export const styles = StyleSheet.create({
  container: {
    padding: 5,
    flexDirection: "row",
  },
  commentsTitle: { fontSize: 18, alignSelf: "center" },
  commentText: {},
  commenterNameText: {},
  commenterAvatar: { width: 36, height: 36, borderRadius: 36 },
  grayText: {},
});
