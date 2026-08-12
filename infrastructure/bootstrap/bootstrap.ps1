param(
    [Parameter(Mandatory=$true)]
    [string]$GithubRepoOwnerUsername,
    [Parameter(Mandatory=$true)]
    [string]$GithubRepoName
)

$oidcRoleName = "github-actions-deploy-role"
$oidcPermissionsPolicyName = "github-actions-deploy-permissions"
$awsRegion = "us-east-1"

# Check for an error ($LASTEXITCODE non-zero) and kill the script
function Assert-Success {
    param(
        [string]$ErrorMessage
    )

    if ($LASTEXITCODE -ne 0) {
        Write-Error $ErrorMessage
        exit 1
    }
}

# Check the user is signed into Github CLI
gh auth status
Assert-Success "Need to be signed into gh CLI to be able to bootstrap the correct github variables."

# Check the user is signed into AWS CLI
$accountId = (aws sts get-caller-identity | ConvertFrom-Json).Account
Assert-Success "Need to be signed into AWS CLI to be able to bootstrap initial OIDC Provider/Role for Github Acitons and Terraform state bucket."

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

# Check for an existing Oidc role. If this errors, redirect stream 2 (errors) into stream 1 (output) with 2>&1.
$getExistingOidcRoleResult = aws iam get-role --role-name $oidcRoleName 2>&1 | Out-String
# Then make sure its a does-not-exist error, then apply the trust policy to the role of the OIDC provider.
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
    Assert-Success "Unexpected error applying role policy. Likely outputted by AWS CLI above."
}

# Apply permissions policy to the OIDC provider's role so github actions can create and modify the necessary resources.
aws iam put-role-policy --role-name $oidcRoleName --policy-document file://permissions-policy.json --policy-name $oidcPermissionsPolicyName
Assert-Success "Unexpected error applying pemissions policy. Likely outputted by AWS CLI above."

# Bucket names are unique across all of AWS, so suffix with the account id to avoid collisions.
$stateBucketName = "frenli-terraform-state-$accountId"

# Check for an existing Terraform state bucket, then create it, and apply versioning/encryption
$headBucketResult = aws s3api head-bucket --bucket $stateBucketName 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) {
    if ($headBucketResult -match "404") {
        Write-Host "Terraform state bucket not found. Creating it."
        aws s3api create-bucket --bucket $stateBucketName --region $awsRegion
        Assert-Success "Unexpected error creating the Terraform state bucket."
    } else {
        Write-Error "Unexpected error checking for the Terraform state bucket."
        Write-Error $headBucketResult
        exit 1
    }
} else {
    Write-Host "Terraform state bucket already exists. Skipping creation."
}

aws s3api put-bucket-versioning --bucket $stateBucketName --versioning-configuration Status=Enabled
Assert-Success "Unexpected error enabling versioning on the Terraform state bucket."
aws s3api put-bucket-encryption --bucket $stateBucketName --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
Assert-Success "Unexpected error enabling encryption on the Terraform state bucket."

# Backend config to tell terraform where to store its own data
$backendConfigContent = @"
bucket         = "$stateBucketName"
key            = "terraform.tfstate"
region         = "$awsRegion"
use_lockfile   = true
encrypt        = true
"@

$backendConfigContent | Out-File ../terraform/backend.hcl -Encoding utf8

# Fetch the role ARN now that the role definitely exists, to push it to GitHub
$oidcRole = aws iam get-role --role-name $oidcRoleName | ConvertFrom-Json
Assert-Success "Unexpected error fetching the role ARN to push to GitHub."

# Set the role in Github variables so pipeline runners can use it
gh variable set AWS_ROLE_ARN --body $oidcRole.Role.Arn --repo "$GithubRepoOwnerUsername/$GithubRepoName"
Assert-Success "Unexpected error setting the AWS_ROLE_ARN github variable."
