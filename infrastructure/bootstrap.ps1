param(
    [Parameter(Mandatory=$true)]
    [string]$GithubRepoOwnerUsername,
    [Parameter(Mandatory=$true)]
    [string]$GithubRepoName
)

$oidcRoleName = "github-actions-deploy-role"
$oidcPermissionsPolicyName = "github-actions-deploy-permissions"
$awsRegion = "us-east-1"

# Check the user is signed into Github CLI
gh auth status
if ($LASTEXITCODE -ne 0) {
    Write-Error "Need to be signed into gh CLI to be able to bootstrap the correct github variables."
    exit 1
}

# Check the user is signed into AWS CLI
$accountId = (aws sts get-caller-identity | ConvertFrom-Json).Account
if ($LASTEXITCODE -ne 0) {
    Write-Error "Need to be signed into AWS CLI to be able to bootstrap initial OIDC Provider/Role for Github Acitons and Terraform state bucket."
    exit 1
}

# Check for a github OIDC provider in AWS, create it if there isnt one
$providers = aws iam list-open-id-connect-providers | ConvertFrom-Json
$existingGithubOidcProviders = ($providers.OpenIDConnectProviderList | Where-Object { $_.Arn -like "*:oidc-provider/token.actions.githubusercontent.com*"})

if ($existingGithubOidcProviders.Count -eq 0) {
$newGithubOidcProvider = aws iam create-open-id-connect-provider --url https://token.actions.githubusercontent.com --client-id-list sts.amazonaws.com --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1" | ConvertFrom-Json
$githubOidcProviderArn = $newGithubOidcProvider.OpenIDConnectProviderArn
} else {
    Write-Host "OIDC Provider has already been bootstrapped in your account. Skipping."
    $githubOidcProviderArn = $existingGithubOidcProviders[0].Arn
}

$OidcTrustPolicyJson = @{
    Version =  "2012-10-17"
    Statement = @(
            @{
            Effect = "Allow"
            Principal = @{
                Federated = $githubOidcProviderArn
            }
            Action = "sts:AssumeRoleWithWebIdentity"
            Condition = @{
                StringEquals = @{
                    "token.actions.githubusercontent.com:aud"  = "sts.amazonaws.com"
                }
                StringLike = @{
                    "token.actions.githubusercontent.com:sub" = "repo:$GithubRepoOwnerUsername/${GithubRepoName}:ref:refs/heads/main"
                }
            }
        }
    )
} | ConvertTo-Json -Depth 6

$OidcTrustPolicyJson | Out-File oidc-trust-policy.json -Encoding utf8 

# Check for an existing Oidc role. If this errors, redirect stream 2 (errors) into stream one (output) with 2>&1 then make sure its a does-not-exist error
# Then apply the trust policy to the role of the OIDC provider.
$getExistingOidcRoleResult = aws iam get-role --role-name $oidcRoleName 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) {
    if ($getExistingOidcRoleResult -match "NoSuchEntity") {
        Write-Host "OIDC role not found. Creating the role."
        aws iam create-role --role-name $oidcRoleName --assume-role-policy-document file://oidc-trust-policy.json

    } else {
        Write-Error "Unexpected Error retrieving role."
        Write-Error $getExistingOidcRoleResult
        exit 1
    }
} else {
    Write-Host "Role already exists. Applying policy."
    aws iam update-assume-role-policy --role-name $oidcRoleName --policy-document file://oidc-trust-policy.json
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Unexpected error applying role policy. Likely outputted by AWS CLI above."
        exit 1
    }
}

# Apply permissions policy to the OIDC provider's role so github actions can create and modify the necessary resources.
aws iam put-role-policy --role-name $oidcRoleName --policy-document file://permissions-policy.json --policy-name $oidcPermissionsPolicyName

if ($LASTEXITCODE -ne 0) {
    Write-Error "Unexpected error applying pemissions policy. Likely outputted by AWS CLI above."
    exit 1
}

# Bucket names are unique across all of AWS, so suffix with the account id to avoid collisions.
$stateBucketName = "frenli-terraform-state-$accountId"

# Check for an existing Terraform state bucket, then create it, and apply versioning/encryption
$headBucketResult = aws s3api head-bucket --bucket $stateBucketName 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) {
    if ($headBucketResult -match "404") {
        Write-Host "Terraform state bucket not found. Creating it."
        aws s3api create-bucket --bucket $stateBucketName --region $awsRegion
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Unexpected error creating the Terraform state bucket."
            exit 1
        }

        aws s3api put-bucket-versioning --bucket $stateBucketName --versioning-configuration Status=Enabled
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Unexpected error enabling versioning on the Terraform state bucket."
            exit 1
        }

        aws s3api put-bucket-encryption --bucket $stateBucketName --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Unexpected error enabling encryption on the Terraform state bucket."
            exit 1
        }
    } else {
        Write-Error "Unexpected error checking for the Terraform state bucket."
        Write-Error $headBucketResult
        exit 1
    }
} else {
    Write-Host "Terraform state bucket already exists. Skipping creation."
}

$stateLockTableName = "frenli-terraform-locks"

# Check for an existing lock table, then create it
$describeTableResult = aws dynamodb describe-table --table-name $stateLockTableName 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) {
    if ($describeTableResult -match "ResourceNotFoundException") {
        Write-Host "Terraform lock table not found. Creating it."
        aws dynamodb create-table --table-name $stateLockTableName --attribute-definitions AttributeName=LockID,AttributeType=S --key-schema AttributeName=LockID,KeyType=HASH --billing-mode PAY_PER_REQUEST --region $awsRegion
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Unexpected error creating the Terraform lock table."
            exit 1
        }
    } else {
        Write-Error "Unexpected error checking for the Terraform lock table."
        Write-Error $describeTableResult
        exit 1
    }
} else {
    Write-Host "Terraform lock table already exists. Skipping creation."
}

# Partial backend config for `terraform init -backend-config=backend.hcl`. The bucket name includes
# the account id, which isnt known until this script runs, so it cant live in a static backend.tf.
$backendConfigContent = @"
bucket         = "$stateBucketName"
key            = "terraform.tfstate"
region         = "$awsRegion"
dynamodb_table = "$stateLockTableName"
encrypt        = true
"@

$backendConfigContent | Out-File backend.hcl -Encoding utf8

# Fetch the role ARN now that the role definitely exists, to push it to GitHub.
$oidcRole = aws iam get-role --role-name $oidcRoleName | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) {
    Write-Error "Unexpected error fetching the role ARN to push to GitHub."
    exit 1
}

gh variable set AWS_ROLE_ARN --body $oidcRole.Role.Arn --repo "$GithubRepoOwnerUsername/$GithubRepoName"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Unexpected error setting the AWS_ROLE_ARN github variable."
    exit 1
}
