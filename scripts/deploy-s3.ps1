param(
  [Parameter(Mandatory = $true)]
  [string]$BucketName,

  [string]$Region = "ap-south-1",

  [string]$Profile = ""
)

Write-Host "Building frontend..."
npm run build

$awsArgs = @("s3", "sync", "./dist", "s3://$BucketName", "--delete", "--region", $Region)
if ($Profile) {
  $awsArgs += @("--profile", $Profile)
}

Write-Host "Uploading files to S3..."
& aws @awsArgs

if ($LASTEXITCODE -ne 0) {
  throw "S3 upload failed."
}

Write-Host "Done."
Write-Host "Open https://$BucketName.s3.$Region.amazonaws.com/"
