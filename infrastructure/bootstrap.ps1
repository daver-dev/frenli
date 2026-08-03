param(
    [Parameter(Mandatory=$true)]
    [string]$GithubRepoOwnerUsername,
    [Parameter(Mandatory=$true)]
    [string]$GithubRepoName
)

$providers = aws iam list-open-id-connect-providers | ConvertFrom-Json
$existingGithubOidcProviders = ($providers.OpenIDConnectProviderList | Where-Object { $_.Arn -like "*:oidc-provider/token.actions.githubusercontent.com*"})


if ($existingGithubOidcProviders.Count -eq 0) {
$newGithubOidcProvider = aws iam create-open-id-connect-provider --url https://token.actions.githubusercontent.com --client-id-list sts.amazonaws.com --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1" | ConvertFrom-Json
$githubOidcProviderArn = $newGithubOidcProvider.OpenIDConnectProviderArn
} else {
    Write-Host "OIDC Provider has already been bootstrapped in your account. Skipping."
    $githubOidcProviderArn = $existingGithubOidcProviders[0].Arn
}

$OidcRoleJson = @{
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

$OidcRoleJson | Out-File oidc-role.json -Encoding utf8 