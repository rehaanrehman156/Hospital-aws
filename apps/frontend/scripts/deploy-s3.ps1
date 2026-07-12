param(
  [Parameter(Mandatory = $true)]
  [string]$BucketName,

  [string]$Region = "ap-south-1",

  [string]$Profile = "",

  [string]$CloudFrontDistributionId = ""
)

Write-Host "Building frontend..."
npm run build

$awsArgs = @("s3", "sync", "./dist", "s3://$BucketName", "--delete", "--region", $Region)
if ($Profile) {
  $awsArgs += @("--profile", $Profile)
}

# Set cache headers for HTML files (short cache - always check for updates)
$awsArgs += @("--exclude", "*", "--include", "*.html", "--cache-control", "public, max-age=3600, must-revalidate")
Write-Host "Uploading HTML files (cache: 1 hour)..."
& aws @awsArgs

if ($LASTEXITCODE -ne 0) {
  throw "S3 HTML upload failed."
}

# Reset args for assets
$awsArgs = @("s3", "sync", "./dist", "s3://$BucketName", "--delete", "--region", $Region)
if ($Profile) {
  $awsArgs += @("--profile", $Profile)
}

# Set cache headers for versioned assets (long cache - safe to cache aggressively)
$awsArgs += @("--exclude", "*.html", "--cache-control", "public, max-age=31536000, immutable")
Write-Host "Uploading assets (cache: 1 year - versioned)..."
& aws @awsArgs

if ($LASTEXITCODE -ne 0) {
  throw "S3 assets upload failed."
}

# Invalidate CloudFront cache if distribution ID is provided
if ($CloudFrontDistributionId) {
  Write-Host "Invalidating CloudFront cache for distribution: $CloudFrontDistributionId"
  $cfArgs = @("cloudfront", "create-invalidation", "--distribution-id", $CloudFrontDistributionId, "--paths", "/*", "--region", $Region)
  if ($Profile) {
    $cfArgs += @("--profile", $Profile)
  }
  
  & aws @cfArgs
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "CloudFront invalidation failed, but S3 upload was successful."
  } else {
    Write-Host "CloudFront cache invalidation initiated."
  }
}

Write-Host "✓ Deployment complete!"
Write-Host "S3 URL: https://$BucketName.s3.$Region.amazonaws.com/"
if ($CloudFrontDistributionId) {
  Write-Host "CloudFront invalidation queued. Changes should be visible within 1-2 minutes."
}
