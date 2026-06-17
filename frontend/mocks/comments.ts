import { Comment, Page } from "@/types";
import { paginate } from "./paginate";

const COMMENTS: Record<string, Comment[]> = {
  "post-1": [
    {
      id: "comment-1",
      postId: "post-1",
      authorId: "user-2",
      authorUsername: "jordan",
      authorAvatarUrl: "https://i.pravatar.cc/150?u=jordan",
      text: "This view looks incredible!",
      createdAt: "2026-06-08T15:00:00.000Z",
      likeCount: 4,
      replyCount: 1,
    },
    {
      id: "comment-1-reply-1",
      postId: "post-1",
      authorId: "user-1",
      authorUsername: "alex",
      authorAvatarUrl: "https://i.pravatar.cc/150?u=alex",
      text: "Right?? Best view all year",
      createdAt: "2026-06-08T15:10:00.000Z",
      likeCount: 1,
      replyCount: 0,
      parentCommentId: "comment-1",
    },
    {
      id: "comment-2",
      postId: "post-1",
      authorId: "user-3",
      authorUsername: "sam",
      authorAvatarUrl: "https://i.pravatar.cc/150?u=sam",
      text: "Wish I could've come along",
      createdAt: "2026-06-08T15:30:00.000Z",
      likeCount: 0,
      replyCount: 0,
    },
    {
      id: "comment-3",
      postId: "post-1",
      authorId: "user-4",
      authorUsername: "taylor",
      authorAvatarUrl: "https://i.pravatar.cc/150?u=taylor",
      text: "Next time invite me!",
      createdAt: "2026-06-08T16:10:00.000Z",
      likeCount: 2,
      replyCount: 0,
    },
  ],
  "post-3": [
    {
      id: "comment-4",
      postId: "post-3",
      authorId: "user-2",
      authorUsername: "jordan",
      authorAvatarUrl: "https://i.pravatar.cc/150?u=jordan",
      text: "That looks amazing 😍",
      createdAt: "2026-06-05T20:00:00.000Z",
      likeCount: 3,
      replyCount: 0,
    },
    {
      id: "comment-5",
      postId: "post-3",
      authorId: "user-5",
      authorUsername: "morgan",
      authorAvatarUrl: "https://i.pravatar.cc/150?u=morgan",
      text: "Recipe please!",
      createdAt: "2026-06-05T20:15:00.000Z",
      likeCount: 1,
      replyCount: 1,
    },
    {
      id: "comment-5-reply-1",
      postId: "post-3",
      authorId: "user-1",
      authorUsername: "alex",
      authorAvatarUrl: "https://i.pravatar.cc/150?u=alex",
      text: "Sending it to you now!",
      createdAt: "2026-06-05T20:25:00.000Z",
      likeCount: 0,
      replyCount: 0,
      parentCommentId: "comment-5",
    },
    {
      id: "comment-6",
      postId: "post-3",
      authorId: "user-3",
      authorUsername: "sam",
      authorAvatarUrl: "https://i.pravatar.cc/150?u=sam",
      text: "Homemade pasta > store bought, no contest",
      createdAt: "2026-06-05T20:45:00.000Z",
      likeCount: 5,
      replyCount: 0,
    },
    {
      id: "comment-7",
      postId: "post-3",
      authorId: "user-4",
      authorUsername: "taylor",
      authorAvatarUrl: "https://i.pravatar.cc/150?u=taylor",
      text: "Saving this for later",
      createdAt: "2026-06-05T21:00:00.000Z",
      likeCount: 0,
      replyCount: 0,
    },
  ],
};

export function getComments(
  postId: string,
  cursor?: string,
): Promise<Page<Comment>> {
  const topLevelComments = (COMMENTS[postId] ?? []).filter(
    (comment) => comment.parentCommentId == null,
  );
  return Promise.resolve(paginate(topLevelComments, cursor));
}

export function getReplies(
  postId: string,
  parentCommentId: string,
  itemsPerPage?: number,
  cursor?: string,
): Promise<Page<Comment>> {
  const replies = (COMMENTS[postId] ?? []).filter(
    (comment) => comment.parentCommentId === parentCommentId,
  );
  return Promise.resolve(paginate(replies, cursor, itemsPerPage));
}
