import { View as ThemedView, useThemeColor } from "@/components/expo/Themed";
import { CommentList } from "@/components/main/CommentList";
import { useComments } from "@/context/CommentsContext";
import { useLoggedInUser } from "@/context/LoggedInUserContext";
import { Octicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import {
  CursorValue,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const CommentsModal = () => {
  const insets = useSafeAreaInsets();
  const commentsBackgroundColor = useThemeColor({}, "overlay");
  const {
    selectedPostId,
    isWebModalVisible,
    bottomSheetRef,
    setIsWebModalVisible,
  } = useComments();
  const { loggedInUser } = useLoggedInUser();

  if (Platform.OS === "web") {
    return (
      <Modal
        visible={isWebModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsWebModalVisible(false);
        }}
      >
        <Pressable
          style={styles.webModalBackdrop}
          onPress={(e) => {
            if (e.target === e.currentTarget) {
              setIsWebModalVisible(false);
            }
          }}
        >
          <ThemedView
            style={[
              styles.webModalContent,
              { backgroundColor: commentsBackgroundColor },
            ]}
          >
            <Pressable
              onPress={() => {
                setIsWebModalVisible(false);
              }}
              style={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}
            >
              <Octicons name="x" size={20} />
            </Pressable>
            <CommentList postId={selectedPostId ?? ""} />
          </ThemedView>
        </Pressable>
      </Modal>
    );
  }

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={["100%"]}
      enableDynamicSizing={false}
      backgroundStyle={{ backgroundColor: commentsBackgroundColor }}
      keyboardBehavior="interactive"
      topInset={insets.top}
    >
      <View style={{ flex: 1, paddingBottom: insets.bottom }}>
        <CommentList postId={selectedPostId ?? ""} />
      </View>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  webModalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    cursor: "default" as CursorValue,
  },
  webModalContent: {
    minWidth: 490,
    borderRadius: 12,
    minHeight: 500,
  },
});
