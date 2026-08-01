# Frenli: Project Roadmap

A no-algorithm social app: feed, messages, notifications, profile, and posting.
React Native (Expo) frontend, Terraform on AWS, GitHub Actions CI/CD. The backend
is implemented more than once (Node.js and Java so far) against the same shared
data model, for comparison/learning purposes: see `node-backend/` and
`java-backend/`.

This roadmap breaks the work into small, ordered tasks. Check items off as you go.
Each milestone is meant to leave you with something runnable/demoable.

---

## Architecture decisions (and why)

These were chosen based on your answers: read this section before starting the
backend/infra milestones, since several tasks depend on these choices.

| Area            | Choice                                                       | Why                                                                                                                                                                                                              |
| --------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend compute | **AWS Lambda**, implemented in both Node.js and Java        | You're cost-sensitive with ~0 users. Fargate+ALB costs ~$25-30/mo idle; Lambda is ~$0/mo idle thanks to its permanent free tier. Multiple language implementations are kept side by side for comparison/learning, not because both need to run in production. |
| Database        | **DynamoDB** (not RDS), for everything                       |
| Auth            | **AWS Cognito**                                              | Managed signup/login/password-reset/email-verification, issues JWTs your Lambdas validate. Less custom security code.                                                                                            |
| Messaging       | **API Gateway WebSocket API + Lambda + DynamoDB**            | Your choice: classic serverless chat pattern.                                                                                                                                                                   |
| Photo storage   | **S3** (+ pre-signed URLs)                                   | Standard, cheap, integrates cleanly with Lambda and Cognito-authenticated uploads.                                                                                                                               |
| Notifications   | **In-app (DynamoDB) + push via Expo's Push API**             | Expo has its own free push service reachable over plain HTTPS: **no AWS SNS needed**, which simplifies "in-app + push" considerably.                                                                            |
| IaC             | **Terraform**, remote state in S3 + DynamoDB lock table      | Standard, your stated requirement.                                                                                                                                                                               |
| CI/CD           | **GitHub Actions + OIDC to AWS** (no long-lived access keys) | Best practice, avoids storing AWS secrets in GitHub.                                                                                                                                                             |

---

## Target repo structure

```
frenli/
├── frontend/        # Expo / React Native app (existing)
├── node-backend/        # Node.js (Lambda)
├── java-backend/        # Java (Lambda)
├── DATA_MODEL.md        # shared by all backend implementations
├── infrastructure/      # Terraform
├── .github/workflows/   # CI/CD pipelines
├── README.md
├── notes.txt
└── ROADMAP.md
```

---

## Milestone 0: Repo & tooling setup

- [x] Create `node-backend/`, `infrastructure/`, `.github/workflows/` folders at the
      repo root (sibling to `frontend/`)
- [x] Create `java-backend/` as a second backend implementation, and move the
      shared data model to a root-level `DATA_MODEL.md`
- [x] Add a root `.gitignore` covering Terraform (`.terraform/`, `*.tfstate*`) and
      Node (already covered in `frontend`)
- [x] Update root `README.md` with a short architecture diagram/description
      (can be a simple text diagram for now)

## Milestone 1: Finish frontend MVP with mock data

Continuation of what's already in `notes.txt` / in progress:

- [ ] Feed page: mock posts + "load more on scroll to bottom" pagination
- [ ] Profile page: profile pic, bio, post grid, same pagination pattern
- [ ] Messages page: mock conversation list + mock thread view
- [ ] Notifications page: mock list (likes, follows, comments, messages)
- [ ] Post creation screen: image picker UI + caption input (mock submit)
- [ ] Comments: mock comments list per post (e.g. post detail view) +
      add-comment input (mock submit)
- [ ] Settings page: basic structure (account, logout placeholder, etc.)
- [ ] Auth screens (login / signup / forgot password): UI only, mock submit
- [ ] Confirm tab navigation covers all 5 sections (feed, messages,
      notifications, post, profile)

## Milestone 2: AWS foundations & Terraform bootstrap

- [ ] Create AWS account (or a dedicated account/org if you have one already)
- [ ] **Set an AWS Budget alert** (e.g., $5/month) immediately: cheap
      insurance against a misconfiguration
- [ ] Create an IAM user/role for Terraform with least-privilege permissions
      (or set up GitHub OIDC role now and use that from day one; see
      Milestone 8)
- [ ] Bootstrap Terraform remote state: S3 bucket (versioned) + DynamoDB table
      for state locking
- [ ] Set up `infrastructure/` with a basic module layout, e.g.:
      `modules/cognito`, `modules/dynamodb`, `modules/s3`, `modules/lambda`,
      `modules/api-gateway`, and an `environments/dev` root config
- [ ] `terraform init` / `plan` / `apply` an empty config to confirm the
      pipeline works end-to-end

## Milestone 3: Authentication (Cognito)

- [ ] Terraform: Cognito User Pool + App Client (no client secret, for mobile)
- [ ] Terraform: configure password policy, email verification, and any
      required custom attributes (e.g., display name)
- [ ] Frontend: integrate Cognito auth (sign up, confirm email, sign in,
      forgot password, sign out, token refresh): `aws-amplify` or
      `amazon-cognito-identity-js`
- [ ] Frontend: wire login/signup screens from Milestone 1 to real Cognito
      calls; store tokens securely (`expo-secure-store`)
- [ ] Backend: shared JWT-validation utility (verify Cognito JWT against the
      User Pool's JWKS) usable by all Lambda functions

## Milestone 4: Core backend API (Lambda + DynamoDB)

- [ ] Design DynamoDB access patterns first, then table(s)/keys; core
      entities: user profile, posts, follows, likes, comments, notifications
      (write down access patterns before designing keys; this is the
      DynamoDB way)
- [ ] Terraform: DynamoDB table(s) with appropriate GSIs for the access
      patterns above
- [ ] Set up `node-backend/` and/or `java-backend/` project; confirm it runs
      locally against a real dev DynamoDB table in AWS
- [ ] Terraform: Lambda function(s) + IAM roles (least privilege per table) +
      API Gateway HTTP API
- [ ] Implement endpoints: create/read user profile, create/list posts
      (feed + per-user), follow/unfollow, like/unlike, comment
- [ ] Frontend: replace feed/profile mock data with real API calls
      (Cognito-authenticated requests)

## Milestone 5: Photo storage (S3)

- [ ] Terraform: S3 bucket for media (private, with appropriate CORS for
      mobile uploads)
- [ ] Backend: endpoint to generate pre-signed S3 upload URLs (scoped to the
      authenticated user)
- [ ] Backend: store resulting object keys/URLs on posts/profile records
- [ ] Frontend: wire post-creation image picker to request a pre-signed URL,
      upload directly to S3, then submit the post
- [ ] Frontend: display profile pictures and post images from S3 (consider a
      CloudFront distribution in front of the bucket for caching/CDN, can be
      deferred)

## Milestone 6: Real-time messaging (WebSocket + Lambda + DynamoDB)

- [ ] Terraform: DynamoDB table for connections (`connectionId` ↔ `userId`)
- [ ] Terraform: DynamoDB table for messages (e.g., partition key
      `conversationId`, sort key `timestamp`)
- [ ] Terraform: API Gateway WebSocket API with `$connect`, `$disconnect`,
      and `sendMessage` routes, each backed by a Lambda
- [ ] Backend: `$connect`/`$disconnect` handlers manage the connections table
      (auth via Cognito JWT passed as a query param at connect time)
- [ ] Backend: `sendMessage` handler persists the message and pushes it to the
      recipient's active connection(s) via the API Gateway Management API
- [ ] Backend: REST endpoint to fetch conversation history (reads from the
      messages table)
- [ ] Frontend: replace mock messages page: open a WebSocket connection,
      send/receive live messages, load history via REST

## Milestone 7: Notifications (in-app + push)

- [ ] Backend: on like/comment/follow/new-message events, write a
      notification record to DynamoDB for the recipient
- [ ] Backend: REST endpoint to list a user's notifications
- [ ] Frontend: replace mock notifications page with real data
- [ ] Frontend: register for push notifications (`expo-notifications`),
      send the resulting Expo push token to the backend, store it
- [ ] Backend: when writing a notification, also POST to Expo's push API
      (`https://exp.host/--/api/v2/push/send`) for that user's token(s): no
      AWS SNS required

## Milestone 8: CI/CD (GitHub Actions)

- [ ] Set up GitHub OIDC → AWS IAM role (no stored AWS access keys)
- [ ] Workflow: frontend; lint/typecheck/test on PR (`frontend`)
- [ ] Workflow: backend; build/test on PR (one per backend implementation
      that's active, e.g. `node-backend`, `java-backend`)
- [ ] Workflow: `terraform plan` on PR for changes under `infrastructure/`,
      posted as a PR comment
- [ ] Workflow: `terraform apply` on merge to `main` (consider a manual
      approval/environment protection rule before apply)
- [ ] Workflow: backend deploy: build the Lambda artifact and update function
      code (via `terraform apply` or a targeted `aws lambda update-function-code`)

## Milestone 9: Observability, cost control & polish

- [ ] CloudWatch alarms: Lambda errors/throttles, API Gateway 5xx rate
- [ ] Confirm the AWS Budget alert from Milestone 2 is still active and
      reflects the full stack
- [ ] Structured logging in Lambda functions
- [ ] Frontend: loading/error states across all screens
- [ ] App icon, splash screen, basic theming pass

## Stretch goals (post-MVP)

- [ ] Real-time feed updates (push new posts from followed users via the
      WebSocket connection)
- [ ] Search (users / posts)
- [ ] Dark mode
- [ ] E2E tests (Detox for the app, or Playwright if a web build is added)
- [ ] Custom domain (Route 53 + ACM) for the API
- [ ] Stories / ephemeral content
