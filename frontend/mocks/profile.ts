import { Page, Post, UserProfile } from "@/types";
import { paginate } from "./paginate";

const PROFILE: UserProfile = {
  id: "user-1",
  username: "alex",
  displayName: "Alex Rivera",
  bio: "Coffee, hikes, and bad puns.",
  avatarUrl: "https://i.pravatar.cc/150?u=alex",
  postCount: 2,
  followerCount: 128,
  followingCount: 97,
};

const PROFILE_POSTS: Post[] = [
  {
    id: "post-1",
    authorId: "user-1",
    authorUsername: "alex",
    authorAvatarUrl: "https://i.pravatar.cc/150?u=alex",
    imageUrl: "https://picsum.photos/seed/post1/600/600",
    caption: "Sunday hike with the crew 🥾",
    createdAt: "2026-06-08T14:30:00.000Z",
    likeCount: 12,
    commentCount: 3,
  },
  {
    id: "post-3",
    authorId: "user-1",
    authorUsername: "alex",
    authorAvatarUrl: "https://i.pravatar.cc/150?u=alex",
    imageUrl: "https://picsum.photos/seed/post3/600/600",
    caption: "Homemade pasta night 🍝",
    createdAt: "2026-06-05T19:45:00.000Z",
    likeCount: 21,
    commentCount: 4,
  },
];

export function getProfile(userId: string): Promise<UserProfile> {
  return Promise.resolve(PROFILE);
}

export function getProfilePostsPage(userId: string, cursor?: string): Promise<Page<Post>> {
  return Promise.resolve(paginate(PROFILE_POSTS, cursor));
}
