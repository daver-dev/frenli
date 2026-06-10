# Frenli

A no-algorithm social media app. Purely stay in touch with your friends without any addiction-driving content feeds.

## Architecture

```
┌────────────┐   Cognito JWT    ┌──────────────────┐      ┌────────────────────┐
│ frontend/  │ ───────────────▶ │   API Gateway     │ ───▶ │   backend/ Lambdas │
│ Expo / RN  │ ◀─────────────── │ (HTTP + WebSocket)│ ◀─── │ (Spring Boot +     │
└────────────┘                  └──────────────────┘      │  Spring Cloud Fn)  │
       │                                                    └─────────┬──────────┘
       │ sign up / sign in                                            │
       ▼                                          ┌────────────────────┼────────────────────┐
┌────────────┐                                    ▼                    ▼                    ▼
│ AWS Cognito │                            ┌────────────┐       ┌────────────┐       ┌────────────┐
└────────────┘                            │  DynamoDB   │       │     S3     │       │ Expo Push  │
                                           │ (all data)  │       │  (media)   │       │    API     │
                                           └────────────┘       └────────────┘       └────────────┘
```

- **frontend/** — Expo / React Native app (feed, messages, notifications, profile, post creation)
- **backend/** — Java (Spring Boot 3 + Spring Cloud Function), deployed as AWS Lambda
- **infrastructure/** — Terraform IaC for all AWS resources
- **.github/workflows/** — CI/CD pipelines (GitHub Actions, OIDC to AWS)

All data lives in DynamoDB (no RDS) to avoid the cost of a NAT Gateway, since
Lambda can reach DynamoDB, S3, Cognito, and API Gateway without a VPC.

See [ROADMAP.md](./ROADMAP.md) for the full phased build plan and the
reasoning behind these choices.
