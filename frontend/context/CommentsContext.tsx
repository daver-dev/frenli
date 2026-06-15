import {
  Text,
  View as ThemedView,
  useThemeColor,
} from "@/components/expo/Themed";
import { CommentList } from "@/components/main/CommentList";
import { Octicons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { createContext, ReactNode, useContext, useRef, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";

interface CommentsContextValue {
  openComments: (postId: string) => void;
}

const CommentsContext = createContext<CommentsContextValue | undefined>(
  undefined,
);

export const CommentsProvider = (props: { children: ReactNode }) => {
  const commentsBackgroundColor = useThemeColor({}, "overlay");
  const commentsTextColor = useThemeColor({}, "background");
  const { children } = props;
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isWebModalVisible, setIsWebModalVisible] = useState(false);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const openComments = (postId: string): void => {
    setSelectedPostId(postId);
    if (Platform.OS === "web") {
      setIsWebModalVisible(true);
    } else {
      bottomSheetRef.current?.present();
    }
  };

  return (
    <CommentsContext.Provider value={{ openComments }}>
      {children}
      {Platform.OS === "web" ? (
        <Modal
          visible={isWebModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsWebModalVisible(false)}
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
      ) : (
        <BottomSheetModal
          ref={bottomSheetRef}
          snapPoints={["80%"]}
          enableDynamicSizing={false}
          backgroundStyle={{ backgroundColor: commentsBackgroundColor }}
        >
          <BottomSheetView>
            <CommentList postId={selectedPostId ?? ""} />
          </BottomSheetView>
        </BottomSheetModal>
      )}
    </CommentsContext.Provider>
  );
};

export const useComments = () => {
  const context = useContext(CommentsContext);
  if (context == undefined) {
    throw new Error("useComments was called outside CommentsProvider");
  } else {
    return context;
  }
};

const styles = StyleSheet.create({
  webModalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    cursor: "default",
  },
  webModalContent: {
    minWidth: 490,
    borderRadius: 12,
    minHeight: 500,
  },
});
