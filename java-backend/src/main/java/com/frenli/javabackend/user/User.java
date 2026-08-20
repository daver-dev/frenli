package com.frenli.javabackend.user;

public record User(
        String userId,
        String username,
        String displayName,
        String bio,
        String avatarKey,
        int postCount,
        int followerCount,
        int followingCount,
        String createdAt
) {}
