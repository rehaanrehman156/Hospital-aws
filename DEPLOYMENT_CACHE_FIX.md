# S3 Frontend Cache & Invalidation Setup

## Problem Solved ✓
You can now see changes immediately after deployment. The solution implements:

1. **Smart Cache Headers** - HTML files cache for 1 hour, versioned assets cache for 1 year
2. **CloudFront Invalidation** - Automatically clears CDN cache on deployment
3. **Integrated Pipeline** - Jenkins automatically handles the entire process

---

## How It Works

### Before Deployment
- Frontend builds to `dist/` folder
- Vite automatically generates versioned filenames for assets (e.g., `index-DRw4c2_s.js`)

### During Deployment
1. **HTML Files**: Uploaded with `max-age=3600` (1 hour) + `must-revalidate`
   - Browser always checks for updates
   - Safe to deploy new versions frequently

2. **JS/CSS/Images**: Uploaded with `max-age=31536000` (1 year) + `immutable`
   - Vite's fingerprinting ensures new builds have different filenames
   - Old versions never expire in cache (safe)
   - New builds load instantly with new filenames

3. **CloudFront Invalidation** (optional): Clears CDN cache
   - Changes visible globally in 1-2 minutes
   - Only if you have CloudFront distribution in front of S3

---

## Setup Instructions

### 1️⃣ Update Jenkins Environment Variables

Edit your Jenkinsfile and set these variables:

```groovy
env.S3_BUCKET = "your-hospital-frontend-bucket"          // Your actual S3 bucket name
env.CLOUDFRONT_DISTRIBUTION_ID = "E1234ABCD..."          // (Optional) Your CloudFront distribution ID
```

### 2️⃣ Get Your CloudFront Distribution ID (Optional)

If you have CloudFront in front of S3:

```bash
aws cloudfront list-distributions --query "DistributionList.Items[0].Id" --output text
```

Or find it in AWS Console:
- CloudFront → Distributions → Distribution ID column

### 3️⃣ Verify IAM Permissions

Your Jenkins IAM user/role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-hospital-frontend-bucket",
        "arn:aws:s3:::your-hospital-frontend-bucket/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation"
      ],
      "Resource": "*"
    }
  ]
}
```

### 4️⃣ Test Locally (Optional)

To test the PowerShell deployment script manually:

```powershell
cd apps/frontend

# With S3 only (no CloudFront):
./scripts/deploy-s3.ps1 -BucketName "your-bucket" -Region "ap-south-1"

# With CloudFront invalidation:
./scripts/deploy-s3.ps1 -BucketName "your-bucket" -CloudFrontDistributionId "E1234ABCD..." -Region "ap-south-1"
```

---

## Cache Strategy Explained

### Why Two Different Cache Durations?

**HTML files** (`index.html`):
- Must be checked on every request
- 1-hour cache allows fresh updates while reducing S3 calls
- `must-revalidate` tells browsers to check server if expired

**Assets** (JS, CSS, images):
- Vite automatically creates versioned filenames
- Example: `app.js` → `app-a1b2c3d4.js`
- Old filenames never change → safe to cache forever
- New builds = new filenames = instant updates

### Example Timeline:
1. User visits app, downloads `index.html` (1 hour cache)
2. HTML references `app-v1.js` → cached 1 year
3. Deploy update:
   - New `index.html` forces refresh
   - References `app-v2.js` (new filename)
   - Vite automatically generates new hash
4. User refreshes browser → sees new version immediately

---

## Monitoring & Troubleshooting

### Verify Deployment

After Jenkins runs, check:

```bash
# List S3 files and their cache headers:
aws s3 ls s3://your-bucket --recursive

# Check specific file headers:
aws s3api head-object --bucket your-bucket --key index.html --query "CacheControl"
```

### Check CloudFront Invalidation Status

```bash
# List recent invalidations:
aws cloudfront list-invalidations --distribution-id E1234ABCD...

# Check specific invalidation:
aws cloudfront get-invalidation --distribution-id E1234ABCD... --id I1234ABCD...
```

### Force-Clear Browser Cache

If changes still don't appear:
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Open DevTools → Settings → Disable cache (while DevTools open)

---

## Next Steps

1. **Update Jenkinsfile** with your S3 bucket and CloudFront ID
2. **Verify IAM permissions** for S3 and CloudFront
3. **Run pipeline** and confirm frontend deploys
4. **Test**: Make a small change to the frontend and verify it appears immediately
5. **Monitor**: Check Jenkins logs for deployment status

---

## Optional: Enable S3 Versioning

For additional safety, enable S3 versioning:

```bash
aws s3api put-bucket-versioning --bucket your-bucket --versioning-configuration Status=Enabled
```

This allows rollback if needed.

---

## Questions?

- Check CloudFront cache invalidation: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html
- S3 cache headers: https://docs.aws.amazon.com/AmazonS3/latest/userguide/ObjectMetadata.html
- Vite asset fingerprinting: https://vitejs.dev/guide/build.html#public-base-path
