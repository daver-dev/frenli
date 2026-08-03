# java-backend Implementation Plan

Reference document only, no code included here. This describes the order and
reasoning for building the first working slice of the backend: a fixed
"current user" (real auth deferred), follows, posts with real picture
uploads, comments, replies, likes, and profile picture/bio editing. Nothing
beyond this list is in scope yet.

## Decisions this plan assumes

- **Real AWS DynamoDB** (not DynamoDB Local) and **real S3** pre-signed
  uploads (not local disk or plain URL strings). Neither is provisioned yet;
  `infrastructure/` is still a placeholder.
- **No real auth yet.** A fixed "current user" stands in for it, designed so
  swapping in real Cognito JWT auth later only touches one place.
- Test users are created through a plain, no-auth "create user" endpoint
  (becomes the real signup endpoint later), not seed scripts.

## Gap found in DATA_MODEL.md

It currently has no **Follow** entity or access patterns at all (only
`followerCount`/`followingCount` numbers were expected on the User type,
nothing else exists on frontend or backend). It also has no counter fields
(`postCount`, `followerCount`, `followingCount`) on the User item, even
though the frontend's `UserProfile` type expects them. Both need to be added
to `DATA_MODEL.md`, following the doc's existing single-table conventions
(same idea as the existing `likeCount`/`commentCount`/`replyCount` counters
and existing GSI pattern), not a new approach.

## Terraform prerequisites (`infrastructure/`)

Needed before any feature can be tested against real resources:

- One DynamoDB table (`frenli-dev`), same key schema already documented
  (`partitionKey` + `sortKey`), pay-per-request billing, and **5 GSIs**: the 4
  already documented (posts-by-user, comments-by-post, replies-by-comment,
  user-by-username) plus a new one for followers (see Data model section).
- One private S3 bucket for media, with CORS allowing upload/download from
  the frontend, since pre-signed uploads go directly client to S3.
- Provider/region/environment config, with the table name and bucket name
  output so they can be pasted into the backend's config.

**Verify**: apply the Terraform config, then confirm in the AWS Console that
the table shows all 5 GSIs with correct key schemas and the bucket exists
with CORS set.

## Data model additions

**Follow**: one item per follow relationship, stored under the follower's
existing user partition (same partition that already holds their profile
record), with the followee's id as part of the sort key. That lets "who do I
follow" be answered directly from that one partition, no extra index needed.
A new secondary index, keyed by followee, answers the reverse question ("who
follows me") from the same items, no extra writes needed. Following/
unfollowing updates both users' follower/following counts atomically in the
same operation, the same transactional approach the doc already uses for
sending a message.

New access patterns to add (continuing the doc's existing numbering
convention): list who a user follows, list a user's followers, follow/
unfollow, check whether the current user follows someone.

**User item**: add `postCount`, `followerCount`, `followingCount`, maintained
the same way the existing like/comment/reply counters are.

## Package structure

Organize by feature, not by layer, e.g. a `user` area, a `follow` area, a
`media` area (S3 upload/download logic), a `post`/`comment`/`reply` area
each, and a `like` area shared by all three of those. Keep controllers thin:
bind the request, call one service method, return a response. Business logic
and DynamoDB access live in the service/repository layers underneath.

Use the plain low-level DynamoDB client rather than a higher-level object
mapper: `DATA_MODEL.md` is written directly in terms of raw attributes on a
shared table, and manual mapping keeps that transparent rather than hiding it
behind annotations, better for a first Java project.

## AWS SDK setup

Add the AWS SDK for Java (v2), DynamoDB and S3 modules. Credentials resolve
via the SDK's default provider chain: locally that reads your `aws configure`
profile, and once deployed to the EC2 instance later it reads the instance's
IAM role automatically, no code change needed either way. Table name, bucket
name, and region come from backend config, populated from the Terraform
outputs above.

## Current-user shim

A small abstraction: "get the current user's id," with one implementation
that reads a fixed id from config for now. After the first user is created
through the API, its id gets pasted into that config so "current user" is a
real row, not a fictional one. Later, a second implementation extracts the
id from a validated JWT instead, replacing the fixed one, nothing else in the
app needs to change.

## Build order and endpoints

Rationale: validate DB wiring on the simplest entity first, then the
simplest relationship (needs at least two users to test), then build the S3
upload flow once and reuse it for both profile pictures and posts, then
posts, then comments, then replies (same nested-counter pattern applied
twice), then likes last since it's one generic pattern reused across three
entity types.

1. **Users** — create user, get user by id, get user by username, get current user
2. **Follows** — follow, unfollow, check follow status, list who a user follows, list a user's followers
3. **Media (S3)** — request a pre-signed upload URL
4. **Edit profile** — update bio and profile picture (using the key from step 3)
5. **Posts** — create post (with a real uploaded image), get post by id, list a user's posts
6. **Comments** — add comment to a post, list comments on a post, get comment by id
7. **Replies** — add reply to a comment, list replies on a comment, get reply by id
8. **Likes** — like/unlike a post, a comment, or a reply, via one shared implementation reused across all three, not written three separate times

Response shaping notes: posts/comments/replies don't store the author's
username/avatar directly, so those get looked up from the author's user
record when building a response (fine at this scale; only worth avoiding
later if it becomes a bottleneck). A reply's response should still include
which comment it belongs to, so the frontend can treat it the way it expects.
Since the media bucket is private, image URLs in responses are pre-signed
download URLs, generated the same way as the upload URLs.

## Verification (no test suite yet)

Use curl, Postman, or IntelliJ's built-in HTTP client, plus the AWS Console
to inspect table contents directly:

- **Infra**: confirm the table's GSIs and the bucket's CORS setup in the
  Console after applying Terraform.
- **AWS wiring**: the app starts with no connection errors.
- **Users**: create two users, confirm both appear correctly in the Console;
  look one up by username. Set one as the current user.
- **Follows**: follow the second user; confirm the relationship item exists,
  confirm it's visible from the "followers" side too, confirm both users'
  counts moved, confirm following the same person twice doesn't double-count,
  confirm unfollowing removes it and decrements counts.
- **Media**: request an upload URL, actually upload a test image with it,
  confirm the object lands in the bucket.
- **Edit profile**: set a bio and profile picture, confirm they're reflected
  back and the image URL actually opens.
- **Posts**: create a post with a real uploaded image, confirm it appears
  correctly, confirm the image opens, confirm the author's post count moved.
- **Comments / Replies**: confirm each parent's comment/reply count
  increments, and listing returns items oldest-first.
- **Likes**: like/unlike a post, a comment, and a reply; confirm counts move
  correctly and double-liking doesn't double-count.
