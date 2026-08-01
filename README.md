# Frenli

A no-algorithm social media app. Purely stay in touch with your friends without any addiction-driving content feeds.

## Architecture

```
┌────────────┐   Cognito JWT    ┌──────────────────┐      ┌────────────────────┐
│ frontend/  │ ───────────────▶ │   API Gateway     │ ───▶ │ {lang}-backend/    │
│ Expo / RN  │ ◀─────────────── │ (HTTP + WebSocket)│ ◀─── │ Lambdas            │
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

- **frontend/**: Expo / React Native app (feed, messages, notifications, profile, post creation)
- **node-backend/** / **java-backend/**: alternate backend implementations of the same API, deployed as AWS Lambda. They share [DATA_MODEL.md](./DATA_MODEL.md) at the repo root.
- **infrastructure/**: Terraform IaC for all AWS resources
- **.github/workflows/**: CI/CD pipelines (GitHub Actions, OIDC to AWS)

All data lives in DynamoDB (no RDS) to avoid the cost of a NAT Gateway, since
Lambda can reach DynamoDB, S3, Cognito, and API Gateway without a VPC.

See [ROADMAP.md](./ROADMAP.md) for the full phased build plan and the
reasoning behind these choices.

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
