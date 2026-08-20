# Frenli: DynamoDB Data Model

Single-table design. All entities share one table (`frenli-{env}`).
Access patterns are defined first; keys are derived from them.

Timestamps are ISO 8601 strings (`2026-07-03T12:00:00.000Z`): lexicographically
sortable, so they work as sort key prefixes for range queries.

---

## A note on DynamoDB keys

Every item in a DynamoDB table is identified by two values:

- **Partition key**: determines which physical partition (server) the item lives
  on. Multiple items can share the same partition key, and DynamoDB keeps them
  co-located so they can be fetched together in one query.
- **Sort key**: within a partition, items are ordered by this value. The
  partition key + sort key pair must be unique for each item.

This design uses both keys on every item.

---

## Access patterns

The numbered labels (U1, P2, C1, etc.) are used later when explaining which
index or query serves each pattern.

### Users

| #   | Pattern                    |
| --- | -------------------------- |
| U1  | Get user profile by userId |
| U2  | Get user by username       |

### Follows

| #   | Pattern                                        |
| --- | ---------------------------------------------- |
| F1  | Follow / unfollow a user                       |
| F2  | Check whether the current user follows someone |
| F3  | List who a user follows                        |
| F4  | List a user's followers                        |

### Posts

| #   | Pattern                                          |
| --- | ------------------------------------------------ |
| P1  | Get post by postId                               |
| P2  | Get posts by userId, newest first (profile page) |

### Post likes

| #   | Pattern                                     |
| --- | ------------------------------------------- |
| PL1 | Like / unlike a post                        |
| PL2 | Check whether the current user liked a post |
| PL3 | Get like count for a post                   |

### Comments

| #   | Pattern                               |
| --- | ------------------------------------- |
| C1  | Get comments for a post, oldest first |
| C2  | Get comment by commentId              |

### Replies

| #   | Pattern                                 |
| --- | --------------------------------------- |
| R1  | Get replies for a comment, oldest first |
| R2  | Get reply by replyId                    |

### Comment / reply likes

| #   | Pattern                                        |
| --- | ---------------------------------------------- |
| CL1 | Like / unlike a comment                        |
| CL2 | Check whether the current user liked a comment |
| CL3 | Like / unlike a reply                          |
| CL4 | Check whether the current user liked a reply   |
| CL5 | Get like count for a comment or reply          |

### Messages

| #   | Pattern                                                  |
| --- | -------------------------------------------------------- |
| M1  | Get conversations for a user, most recent first          |
| M2  | Get messages in a conversation, newest first (paginated) |
| M3  | Send a message                                           |

---

## Table design

**Table name:** `frenli-{env}` (e.g. `frenli-dev`)  
**Keys:** partition key `partitionKey` (String) + sort key `sortKey` (String)

---

### A note on `#METADATA` sort keys

Because multiple item types share the same partition (for example, a post's
main data and all of its like items live under the same `POST#<postId>`
partition), we need a way to distinguish "the main record for this entity" from
the other items in the same partition.

The sort key `#METADATA` serves as that marker. It means: _this is the core
record for this entity, containing all of its fields._ The `#` prefix is a
convention that makes it sort before other sort key values (like `LIKE#...`),
so it always appears first when you scan a partition.

---

### A note on secondary indexes (GSIs)

DynamoDB only lets you query by partition key (and optionally sort key). If you
want to query items by a _different_ field (for example, find all posts by a
given user), you need a **Global Secondary Index (GSI)**. A GSI is a separate,
automatically maintained index on the same table that uses different key fields.

To put an item into a GSI, you add the GSI's key fields as regular attributes
on that item. Items that don't have those attributes set are automatically
excluded from the index: this is called a **sparse index**, and it's
intentional. It keeps the index small by only including the items that
actually need to be queried that way.

For example, only User items have a `username` attribute, so only User items
appear in the username index (GSI4). Post items, Comment items, etc. are
automatically excluded because they don't have a `username` field.

---

### Item types

#### User

```
partitionKey:  USER#<userId>
sortKey:       #METADATA

userId          String   Cognito sub (UUID)
username        String
displayName     String   optional
bio             String   optional
avatarKey       String   S3 object key, optional
postCount       Number   see Counters section below
followerCount   Number   see Counters section below
followingCount  Number   see Counters section below
createdAt       String   ISO 8601

[GSI4PK]: username
```

The `GSI4PK` attribute is what places this item in GSI4.
Setting it to `username` means GSI4 lets you look up a user directly by their
username (access pattern U2), without scanning the whole table.

---

#### Follow

```
partitionKey:  USER#<followerId>
sortKey:       FOLLOWS#<followeeId>

followerId    String
followeeId    String
createdAt     String   ISO 8601

[GSI5PK]: USER#<followeeId>
[GSI5SK]:      createdAt
```

Follow items live under the follower's own partition, alongside their
`#METADATA` profile item. This answers "who does this user follow" (F3)
directly: query `partitionKey = USER#<followerId>`, `sortKey begins_with
FOLLOWS#`. To check whether the current user follows someone (F2), fetch the
single item at `partitionKey = USER#<followerId>`, `sortKey =
FOLLOWS#<followeeId>`. To follow / unfollow (F1), create or delete that item.

`GSI5PK` and `GSI5SK` place this item in GSI5, keyed by the followee instead
of the follower. This answers the reverse question, "who follows this user"
(F4), without any extra writes: the same item is simply indexed a second way.

---

#### Post

```
partitionKey:  POST#<postId>
sortKey:       #METADATA

postId        String   UUID
userId        String
caption       String   optional
mediaKey      String   S3 object key, optional
likeCount     Number   see Counters section below
commentCount  Number   see Counters section below
createdAt     String   ISO 8601

[GSI1PK]: USER#<userId>
[GSI1SK]:      createdAt
```

The `GSI1PK` and `GSI1SK` attributes place this item in GSI1.
GSI1 lets you query "all posts where `GSI1PK = USER#<userId>`",
sorted by `createdAt`: this is what serves access pattern P2 (posts by user,
newest first).

---

#### Post like

```
partitionKey:  POST#<postId>
sortKey:       LIKE#<userId>

createdAt     String
```

Post like items share the same partition as the post's `#METADATA` item.
To check whether a user liked a post (PL2), fetch the single item at
`partitionKey = POST#<postId>`, `sortKey = LIKE#<userId>`: if it exists,
they liked it.
To like / unlike (PL1), create or delete that item.
The like count (PL3) is read from the `likeCount` field on the post's
`#METADATA` item: see the Counters section below for how that stays accurate.

---

#### Comment

```
partitionKey:  COMMENT#<commentId>
sortKey:       #METADATA

commentId     String   UUID
postId        String
userId        String
body          String
likeCount     Number   see Counters section below
replyCount    Number   see Counters section below
createdAt     String   ISO 8601

[GSI2PK]: POST#<postId>
[GSI2SK]:      createdAt
```

GSI2 lets you query "all comments where `GSI2PK = POST#<postId>`",
sorted by `createdAt`: this serves access pattern C1 (comments for a post,
oldest first).

---

#### Comment like

```
partitionKey:  COMMENT#<commentId>
sortKey:       LIKE#<userId>

createdAt     String
```

Same pattern as post likes, but under a comment's partition.
To check whether a user liked a comment (CL2), fetch the item at
`partitionKey = COMMENT#<commentId>`, `sortKey = LIKE#<userId>`.

---

#### Reply

```
partitionKey:  REPLY#<replyId>
sortKey:       #METADATA

replyId       String   UUID
commentId     String
userId        String
body          String
likeCount     Number   see Counters section below
createdAt     String   ISO 8601

[GSI3PK]: COMMENT#<commentId>
[GSI3SK]:      createdAt
```

GSI3 lets you query "all replies where `GSI3PK = COMMENT#<commentId>`",
sorted by `createdAt`: this serves access pattern R1 (replies for a comment,
oldest first).

---

#### Reply like

```
partitionKey:  REPLY#<replyId>
sortKey:       LIKE#<userId>

createdAt     String
```

---

#### Conversation

ConversationId is deterministic: `<smallerUserId>#<largerUserId>` (the two
participant IDs sorted alphabetically and joined). No lookup needed: both
participants can compute it locally from each other's userId.

```
partitionKey:  CONV#<conversationId>
sortKey:       #METADATA

conversationId   String
participantIds   List<String>
lastMessage      String   preview text
lastSenderId     String
lastTimestamp    String   ISO 8601
```

---

#### Message

```
partitionKey:  CONV#<conversationId>
sortKey:       MSG#<createdAt>#<messageId>

messageId     String   UUID
senderId      String
body          String
createdAt     String   ISO 8601
```

All messages in a conversation share the same partition (`CONV#<conversationId>`),
so one query returns all of them. DynamoDB returns items in sort key order by
default (oldest first). To get newest first (access pattern M2), set
`ScanIndexForward: false` in the query: this tells DynamoDB to walk the sort
key in reverse, returning the most recent messages first.

The `#<messageId>` suffix on the sort key ensures two messages sent at the
exact same millisecond don't overwrite each other.

---

#### User ↔ Conversation (one item per participant per conversation)

These items are how we know which conversations a user is part of.
Each conversation creates one of these items for each participant.

```
partitionKey:  USER#<userId>
sortKey:       CONV#<conversationId>

conversationId   String
otherUserId      String
lastMessage      String   preview text
lastTimestamp    String   ISO 8601
unreadCount      Number
```

To list a user's conversations (M1), query `partitionKey = USER#<userId>` with
`sortKey begins_with CONV#` and sort the results by `lastTimestamp` in
application code. For a normal inbox this is a small number of items and
sorting in code is fine.

> **If this becomes a bottleneck:** DynamoDB supports Local Secondary Indexes
> (LSIs), which are like GSIs but they reuse the same partition key as the main
> table and let you sort by a different field. An LSI on `lastTimestamp` would
> let DynamoDB return conversations pre-sorted without any application-side
> sorting. The catch is that LSIs must be defined when the table is first
> created and cannot be added later.

When a message is sent (M3), three things must happen together:

1. Create the Message item.
2. Update the Conversation `#METADATA` item (lastMessage, lastTimestamp).
3. Update both participants' User↔Conversation items.

DynamoDB's `TransactWriteItems` lets you do all three in a single atomic
operation: either all succeed or none do.

---

## GSI summary

A GSI is a secondary index that lets DynamoDB answer a query it otherwise
couldn't. Each GSI has its own partition key and (optionally) sort key,
stored as regular attributes on the items that need to appear in it.

| GSI  | Items indexed | Partition key attribute          | Sort key attribute     | Answers                  |
| ---- | ------------- | -------------------------------- | ---------------------- | ------------------------ |
| GSI1 | Posts         | `GSI1PK` = `USER#<userId>`       | `GSI1SK` = `createdAt` | P2: posts by user        |
| GSI2 | Comments      | `GSI2PK` = `POST#<postId>`       | `GSI2SK` = `createdAt` | C1: comments on a post   |
| GSI3 | Replies       | `GSI3PK` = `COMMENT#<commentId>` | `GSI3SK` = `createdAt` | R1: replies on a comment |
| GSI4 | Users         | `GSI4PK` = `username`            | N/A                    | U2: user by username     |
| GSI5 | Follows       | `GSI5PK` = `USER#<followeeId>`   | `GSI5SK` = `createdAt` | F4: followers of a user  |

Only the specific item type listed in each row has those GSI attributes set.
All other item types in the table simply don't have those fields, so they
don't appear in that index.

---

## Counters

`likeCount`, `commentCount`, and `replyCount` are stored directly on the
parent item (post, comment, or reply) rather than being calculated by counting
all the individual like/comment/reply items each time someone loads a post.
Counting every time would require scanning potentially thousands of items on
every page load: storing the number directly makes reads fast.

The tradeoff is that the write path (liking, commenting, replying) must always
update the counter at the same time. DynamoDB's `ADD` expression does this
safely: it increments or decrements the number in a single operation that
cannot be partially applied, so two simultaneous likes can't both read "5",
both write "6", and end up with the count being one too low.

Example (like a post):

1. Create the Post Like item. Use a condition that fails if it already exists,
   so a double-tap can't like the same post twice.
2. If that succeeds, update the Post item: add 1 to `likeCount`.

The same pattern applies to `postCount`, `followerCount`, and `followingCount`
on the User item. Following/unfollowing updates both users' counts atomically,
using the same `TransactWriteItems` approach the doc uses for sending a
message.




EXAMPLE RECORDS

User (u1)
partitionKey=USER#u1 sortKey=#METADATA
userId=u1 username=daver displayName=Dave R bio="just here to post"
avatarKey=avatars/u1.jpg postCount=3 followerCount=12 followingCount=8
createdAt=2026-07-01T10:00:00.000Z
GSI4PK=daver

Follow (u1 follows u2)
partitionKey=USER#u1 sortKey=FOLLOWS#u2
followerId=u1 followeeId=u2 createdAt=2026-07-02T09:00:00.000Z
GSI5PK=USER#u2 GSI5SK=2026-07-02T09:00:00.000Z

Post (p1, by u1)
partitionKey=POST#p1 sortKey=#METADATA
postId=p1 userId=u1 caption="sunset pic" mediaKey=posts/p1.jpg
likeCount=5 commentCount=2 createdAt=2026-07-03T12:00:00.000Z
GSI1PK=USER#u1 GSI1SK=2026-07-03T12:00:00.000Z

Post like (u2 likes p1)
partitionKey=POST#p1 sortKey=LIKE#u2
createdAt=2026-07-03T13:00:00.000Z

Comment (c1, by u2, on p1)
partitionKey=COMMENT#c1 sortKey=#METADATA
commentId=c1 postId=p1 userId=u2 body="nice shot!"
likeCount=1 replyCount=1 createdAt=2026-07-03T14:00:00.000Z
GSI2PK=POST#p1 GSI2SK=2026-07-03T14:00:00.000Z

Comment like (u1 likes c1)
partitionKey=COMMENT#c1 sortKey=LIKE#u1
createdAt=2026-07-03T14:30:00.000Z

Reply (r1, by u1, on c1)
partitionKey=REPLY#r1 sortKey=#METADATA
replyId=r1 commentId=c1 userId=u1 body="thanks!"
likeCount=0 createdAt=2026-07-03T15:00:00.000Z
GSI3PK=COMMENT#c1 GSI3SK=2026-07-03T15:00:00.000Z

Reply like (u2 likes r1)
partitionKey=REPLY#r1 sortKey=LIKE#u2
createdAt=2026-07-03T15:10:00.000Z

Conversation (u1 & u2)
partitionKey=CONV#u1#u2 sortKey=#METADATA
conversationId=u1#u2 participantIds=[u1,u2]
lastMessage="see you tomorrow" lastSenderId=u1 lastTimestamp=2026-07-04T09:00:00.000Z

Message (in that conversation)
partitionKey=CONV#u1#u2 sortKey=MSG#2026-07-04T09:00:00.000Z#m1
messageId=m1 senderId=u1 body="see you tomorrow" createdAt=2026-07-04T09:00:00.000Z

User↔Conversation (u1's pointer to it)
partitionKey=USER#u1 sortKey=CONV#u1#u2
conversationId=u1#u2 otherUserId=u2
lastMessage="see you tomorrow" lastTimestamp=2026-07-04T09:00:00.000Z unreadCount=0
