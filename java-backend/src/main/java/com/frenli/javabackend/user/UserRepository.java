package com.frenli.javabackend.user;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.HashMap;
import java.util.Map;

@Repository
public class UserRepository {

    private final String tableName;
    private final DynamoDbClient dynamoDbClient;

    public UserRepository(DynamoDbClient dynamoDbClient, @Value("${aws.dynamodb.tableName}") String tableName) {
        this.tableName = tableName;
        this.dynamoDbClient = dynamoDbClient;
    }

    public void save(User user) {
        Map<String, AttributeValue> dynamoUserItem = new HashMap<>();
    }
}
