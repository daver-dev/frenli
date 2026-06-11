import { Notification, Page } from "@/types";
import { paginate } from "./paginate";

const NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    type: "like",
    actorId: "user-2",
    actorUsername: "jordan",
    actorAvatarUrl: "https://i.pravatar.cc/150?u=jordan",
    postId: "post-1",
    createdAt: "2026-06-09T10:00:00.000Z",
    read: false,
  },
  {
    id: "notif-2",
    type: "follow",
    actorId: "user-3",
    actorUsername: "sam",
    actorAvatarUrl: "https://i.pravatar.cc/150?u=sam",
    createdAt: "2026-06-08T18:20:00.000Z",
    read: true,
  },
];

export function getNotificationsPage(cursor?: string): Promise<Page<Notification>> {
  return Promise.resolve(paginate(NOTIFICATIONS, cursor));
}
