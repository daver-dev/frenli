export interface Page<T> {
  items: T[];
  nextCursor?: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorUsername: string;
  authorAvatarUrl: string;
  imageUrl: string;
  caption: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
}

export interface Conversation {
  id: string;
  otherParticipant: {
    id: string;
    username: string;
    avatarUrl: string;
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export type NotificationType = "like" | "follow" | "comment" | "message";

export interface Notification {
  id: string;
  type: NotificationType;
  actorId: string;
  actorUsername: string;
  actorAvatarUrl: string;
  postId?: string;
  createdAt: string;
  read: boolean;
}
