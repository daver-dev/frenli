package com.frenli.javabackend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import org.springframework.beans.factory.annotation.Value;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
public class AwsClientConfig {
    @Value("${aws.region}")
    private String region;

    @Bean
    public DynamoDbClient dynamoDbClient() {
        return DynamoDbClient.builder().region(Region.of(region)).build();
    }

    @Bean
    public S3Client s3Client() {
        return S3Client.builder().region(Region.of(region)).build();
    }
}
