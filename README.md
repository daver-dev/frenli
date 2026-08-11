# Frenli (WIP)

A no-algorithm social media app. Purely stay in touch with your friends without any addiction-driving content feeds.

## Architecture

```
┌────────────┐   Cognito JWT    ┌──────────────────┐      ┌────────────────────┐
│ frontend/  │ ───────────────▶ │   API Gateway     │ ───▶ │ node-backend/      │
│ Expo / RN  │ ◀─────────────── │ (HTTP + WebSocket)│ ◀─── │ Lambdas (Node.js)  │
└────────────┘                  └──────────────────┘      │                    │
       │                                                    └─────────┬──────────┘
       │ sign up / sign in                                            │
       ▼                                               ┌────────────────┴────────────────┐
┌────────────┐                                          ▼                                 ▼
│ AWS Cognito │                                  ┌────────────┐                    ┌────────────┐
└────────────┘                                    │  DynamoDB   │                    │     S3     │
                                                   │ (all data)  │                    │  (media)   │
                                                   └────────────┘                    └────────────┘
```

`java-backend/` isn't part of this diagram: it's a normal Spring Boot app on a
single EC2 instance, started only when testing and stopped otherwise, hit
directly by the frontend. It reaches the same DynamoDB / S3 / Cognito
resources.

- **frontend/**: Expo / React Native app (feed, messages, notifications, profile, post creation)
- **node-backend/**: Node.js, deployed as AWS Lambda behind API Gateway
- **java-backend/**: Java (Spring Boot), deployed as a normal always-on app on a single EC2 instance
- Both share [DATA_MODEL.md](./DATA_MODEL.md) at the repo root; they're alternate implementations of the same API, kept for comparison/learning, not meant to both run in production at once.
- **infrastructure/**: Terraform IaC for all AWS resources
- **.github/workflows/**: CI/CD pipelines (GitHub Actions, OIDC to AWS)

All data lives in DynamoDB (no RDS) to avoid the cost of a NAT Gateway, since
Lambda can reach DynamoDB, S3, Cognito, and API Gateway without a VPC.

## Architecture decisions (and why)

| Area            | Choice                                                       | Why                                                                                                                                                                                                              |
| --------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend compute | **`node-backend/`: AWS Lambda.** **`java-backend/`: Spring Boot on a single EC2 instance**, started only for testing (a few hours/month) and stopped otherwise. | You're cost-sensitive with ~0 users. Lambda is ~$0/mo idle. EC2 bills per-second while running and ~$0 while stopped, so an instance only powered on for testing is just as cheap in practice, while being the standard, simpler way to run Spring Boot for a first Java project. Multiple backend implementations are kept side by side for comparison/learning, not because both need to run in production. |
| Database        | **DynamoDB** (not RDS), for everything                       | Avoids the ~$32/mo NAT Gateway that VPC-attached Lambda + RDS would require.                                                                                                                                     |
| Auth            | **AWS Cognito**                                              | Managed signup/login/password-reset/email-verification, issues JWTs your backends validate. Less custom security code.                                                                                          |
| Messaging       | **API Gateway WebSocket API + Lambda + DynamoDB**            | Classic serverless chat pattern.                                                                                                                                                                                 |
| Photo storage   | **S3** (+ pre-signed URLs)                                   | Standard, cheap, integrates cleanly with Lambda and Cognito-authenticated uploads.                                                                                                                               |
| Notifications   | **In-app only (DynamoDB)**                                   | No push notifications wanted, so no AWS SNS or Expo push integration needed.                                                                                                                                     |
| IaC             | **Terraform**, remote state in S3 + DynamoDB lock table      | Standard, your stated requirement.                                                                                                                                                                               |
| CI/CD           | **GitHub Actions + OIDC to AWS** (no long-lived access keys) | Best practice, avoids storing AWS secrets in GitHub.                                                                                                                                                             |

## Setup

1. Install Git, Node.js (LTS), the AWS CLI, Terraform, and the Expo CLI
   (`npx expo`).
2. Create/select an AWS account and an IAM identity able to create Cognito,
   DynamoDB, S3, API Gateway, and Lambda resources, then run `aws configure`
   with its credentials.
3. Bootstrap Terraform's remote state: an S3 bucket (versioned) and a
   DynamoDB table for locking. These are created once, manually, outside
   Terraform, since Terraform needs them to exist before it can store its
   own state there:
   ```
   aws s3api create-bucket --bucket <unique-bucket-name> --region <region>
   aws s3api put-bucket-versioning --bucket <unique-bucket-name> \
     --versioning-configuration Status=Enabled
   aws dynamodb create-table --table-name terraform-locks \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST
   ```
4. Point `infrastructure/` at that bucket/table as its backend, then run
   `terraform init`, `terraform plan`, and `terraform apply`.
5. To preview `frontend/`, install Expo Go on a phone or set up an
   iOS/Android simulator.

GitHub Actions handles CI/CD via OIDC once the AWS role is set up, no AWS
credentials are stored in GitHub itself.
