import { BottomSheetModal } from "@gorhom/bottom-sheet";
import {
  createContext,
  ReactNode,
  RefObject,
  useContext,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

type CommentsContextValue = {
  selectedPostId: string | null;
  isWebModalVisible: boolean;
  bottomSheetRef: RefObject<BottomSheetModal | null>;
  openComments: (postId: string) => void;
  setIsWebModalVisible: (visible: boolean) => void;
};

const CommentsContext = createContext<CommentsContextValue | undefined>(
  undefined,
);

export const CommentsProvider = (props: { children: ReactNode }) => {
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
    <CommentsContext.Provider
      value={{
        selectedPostId,
        isWebModalVisible,
        bottomSheetRef,
        openComments,
        setIsWebModalVisible,
      }}
    >
      {children}
    </CommentsContext.Provider>
  );
};

export const useComments = () => {
  const commentContext = useContext(CommentsContext);
  if (commentContext == undefined) {
    throw new Error("useComments was called outside CommentsProvider");
  } else {
    return commentContext;
  }
};
