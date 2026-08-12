User (u1)
partitionKey=USER#u1  sortKey=#METADATA
userId=u1  username=daver  displayName=Dave R  bio="just here to post"
avatarKey=avatars/u1.jpg  postCount=3  followerCount=12  followingCount=8
createdAt=2026-07-01T10:00:00.000Z
GSI4PK=daver

Follow (u1 follows u2)
partitionKey=USER#u1  sortKey=FOLLOWS#u2
followerId=u1  followeeId=u2  createdAt=2026-07-02T09:00:00.000Z
GSI5PK=USER#u2  GSI5SK=2026-07-02T09:00:00.000Z

Post (p1, by u1)
partitionKey=POST#p1  sortKey=#METADATA
postId=p1  userId=u1  caption="sunset pic"  mediaKey=posts/p1.jpg
likeCount=5  commentCount=2  createdAt=2026-07-03T12:00:00.000Z
GSI1PK=USER#u1  GSI1SK=2026-07-03T12:00:00.000Z

Post like (u2 likes p1)
partitionKey=POST#p1  sortKey=LIKE#u2
createdAt=2026-07-03T13:00:00.000Z

Comment (c1, by u2, on p1)
partitionKey=COMMENT#c1  sortKey=#METADATA
commentId=c1  postId=p1  userId=u2  body="nice shot!"
likeCount=1  replyCount=1  createdAt=2026-07-03T14:00:00.000Z
GSI2PK=POST#p1  GSI2SK=2026-07-03T14:00:00.000Z

Comment like (u1 likes c1)
partitionKey=COMMENT#c1  sortKey=LIKE#u1
createdAt=2026-07-03T14:30:00.000Z

Reply (r1, by u1, on c1)
partitionKey=REPLY#r1  sortKey=#METADATA
replyId=r1  commentId=c1  userId=u1  body="thanks!"
likeCount=0  createdAt=2026-07-03T15:00:00.000Z
GSI3PK=COMMENT#c1  GSI3SK=2026-07-03T15:00:00.000Z

Reply like (u2 likes r1)
partitionKey=REPLY#r1  sortKey=LIKE#u2
createdAt=2026-07-03T15:10:00.000Z

Conversation (u1 & u2)
partitionKey=CONV#u1#u2  sortKey=#METADATA
conversationId=u1#u2  participantIds=[u1,u2]
lastMessage="see you tomorrow"  lastSenderId=u1  lastTimestamp=2026-07-04T09:00:00.000Z

Message (in that conversation)
partitionKey=CONV#u1#u2  sortKey=MSG#2026-07-04T09:00:00.000Z#m1
messageId=m1  senderId=u1  body="see you tomorrow"  createdAt=2026-07-04T09:00:00.000Z

User↔Conversation (u1's pointer to it)
partitionKey=USER#u1  sortKey=CONV#u1#u2
conversationId=u1#u2  otherUserId=u2
lastMessage="see you tomorrow"  lastTimestamp=2026-07-04T09:00:00.000Z  unreadCount=0