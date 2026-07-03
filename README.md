# Frenli

A no-algorithm social media app. Purely stay in touch with your friends without any addiction-driving content feeds.

## Architecture

```
┌────────────┐   Cognito JWT    ┌──────────────────┐      ┌────────────────────┐
│ frontend/  │ ───────────────▶ │   API Gateway     │ ───▶ │ node-backend/      │
│ Expo / RN  │ ◀─────────────── │ (HTTP + WebSocket)│ ◀─── │ Lambdas (Node.js)  │
└────────────┘                  └──────────────────┘      │                    │
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
- **node-backend/** — Node.js, deployed as AWS Lambda
- **infrastructure/** — Terraform IaC for all AWS resources
- **.github/workflows/** — CI/CD pipelines (GitHub Actions, OIDC to AWS)

All data lives in DynamoDB (no RDS) to avoid the cost of a NAT Gateway, since
Lambda can reach DynamoDB, S3, Cognito, and API Gateway without a VPC.

See [ROADMAP.md](./ROADMAP.md) for the full phased build plan and the
reasoning behind these choices.

## Prerequisites

To run and deploy this project from scratch you'll need:

- **AWS account** — with an IAM identity able to create Cognito, DynamoDB,
  S3, API Gateway, and Lambda resources
- **AWS CLI** — configured (`aws configure`) with credentials for that IAM
  identity
- **Terraform** — for provisioning AWS infrastructure
- **Node.js** (LTS) — for `node-backend/` and `frontend/`
- **Expo CLI** (`npx expo`) — for running the `frontend/` app; a phone with
  Expo Go, or an iOS/Android simulator, to preview it
- **Git**

GitHub Actions handles CI/CD via OIDC once the AWS role is set up — no AWS
credentials are stored in GitHub itself.
