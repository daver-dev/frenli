import { Conversation, Message, Page } from "@/types";
import { paginate } from "./paginate";

const CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    otherParticipant: {
      id: "user-2",
      username: "jordan",
      avatarUrl: "https://i.pravatar.cc/150?u=jordan",
    },
    lastMessage: "See you at 6!",
    lastMessageAt: "2026-06-10T08:00:00.000Z",
    unreadCount: 1,
  },
  {
    id: "conv-2",
    otherParticipant: {
      id: "user-3",
      username: "sam",
      avatarUrl: "https://i.pravatar.cc/150?u=sam",
    },
    lastMessage: "Haha no way 😂",
    lastMessageAt: "2026-06-09T20:42:00.000Z",
    unreadCount: 0,
  },
];

const MESSAGES: Record<string, Message[]> = {
  "conv-1": [
    {
      id: "msg-1",
      conversationId: "conv-1",
      senderId: "user-2",
      text: "Hey, still on for the hike Sunday?",
      createdAt: "2026-06-10T07:55:00.000Z",
    },
    {
      id: "msg-2",
      conversationId: "conv-1",
      senderId: "user-2",
      text: "See you at 6!",
      createdAt: "2026-06-10T08:00:00.000Z",
    },
  ],
  "conv-2": [
    {
      id: "msg-3",
      conversationId: "conv-2",
      senderId: "user-1",
      text: "Did you see the score last night?",
      createdAt: "2026-06-09T20:40:00.000Z",
    },
    {
      id: "msg-4",
      conversationId: "conv-2",
      senderId: "user-3",
      text: "Haha no way 😂",
      createdAt: "2026-06-09T20:42:00.000Z",
    },
  ],
};

export function getConversations(): Promise<Conversation[]> {
  return Promise.resolve(CONVERSATIONS);
}

export function getMessagesPage(conversationId: string, cursor?: string): Promise<Page<Message>> {
  return Promise.resolve(paginate(MESSAGES[conversationId] ?? [], cursor));
}
