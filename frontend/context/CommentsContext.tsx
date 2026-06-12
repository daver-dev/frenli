import { createContext, useState } from "react";

interface CommentsContextValue {
  openComments: (postId: string) => void;
}

const CommentsContext = createContext<CommentsContextValue | undefined>(
  undefined,
);

export const CommentsProvider = () => {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const openComments = (postId: string): void => {};

  return <>yo</>;
};
