# S3 Frontend Deployment Setup

## ✅ Current Configuration

```
S3 Bucket: hospital-frontend-rehaan-tg
Region: ap-south-1
CloudFront: Not configured (optional, can add later)
```

---

## 🎯 How It Works

1. **Jenkins Pipeline** builds React frontend → `dist/` folder
2. **Uploads to S3** with smart cache headers:
   - `index.html` → 1 hour cache
   - `*.js`, `*.css`, images → 1 year cache (versioned by Vite)
3. **Browser accesses**: `https://hospital-frontend-rehaan-tg.s3.ap-south-1.amazonaws.com/`
4. **Frontend calls Backend API** → Your Express server on EKS

---

## ✅ Pre-Deployment Checklist

### 1. S3 Bucket Configuration

Enable **Static Website Hosting** on your bucket:

```bash
aws s3 website s3://hospital-frontend-rehaan-tg \
  --index-document index.html \
  --error-document index.html \
  --region ap-south-1
```

Or via AWS Console:
- S3 → your-bucket → Properties → Static website hosting → Enable
- Index document: `index.html`
- Error document: `index.html` (for React Router SPA)

### 2. S3 Bucket Policy (Public Access)

Your bucket needs a policy to allow public read access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::hospital-frontend-rehaan-tg/*"
    }
  ]
}
```

Apply via AWS CLI:
```bash
aws s3api put-bucket-policy --bucket hospital-frontend-rehaan-tg \
  --policy file://bucket-policy.json \
  --region ap-south-1
```

### 3. Jenkins IAM Permissions

Jenkins user/role needs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": [
        "arn:aws:s3:::hospital-frontend-rehaan-tg",
        "arn:aws:s3:::hospital-frontend-rehaan-tg/*"
      ]
    }
  ]
}
```

---

## 🚀 Deploying with Jenkins

### Current Pipeline Flow

```
Checkout → Build Backend Docker → Push to ECR → Deploy Backend to EKS
                                                       ↓
                           Build Frontend (npm build) → Upload to S3
                                                       ↓
                                           Health Check
```

### Trigger Deployment

1. **Make a change** to your frontend code
2. **Commit & push** to your git repo
3. **Jenkins auto-triggers** (or manually start)
4. **Pipeline runs**:
   - Builds backend Docker image
   - Deploys backend to EKS
   - Builds frontend with Vite
   - Uploads to S3
   - Sets cache headers

---

## 🔗 Accessing Your Frontend

After deployment:

```
S3 Direct URL: https://hospital-frontend-rehaan-tg.s3.ap-south-1.amazonaws.com/
Website URL: http://hospital-frontend-rehaan-tg.s3-website.ap-south-1.amazonaws.com/
```

### API Calls from Frontend

Your React app calls the backend API:

```javascript
// Example API call
const response = await fetch('https://your-backend-api.com/dashboard');
```

Configure your backend URL in frontend `.env`:

```
VITE_API_URL=https://your-backend-eks-service.com
```

Then in React:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
```

---

## ✅ Verify Deployment

After Jenkins completes:

```bash
# List uploaded files
aws s3 ls s3://hospital-frontend-rehaan-tg --recursive

# Check file cache headers
aws s3api head-object \
  --bucket hospital-frontend-rehaan-tg \
  --key index.html \
  --query "CacheControl"

# Result should show: "public, max-age=3600, must-revalidate"
```

---

## 🧪 Test the Deployment

1. **Open browser**:
   ```
   https://hospital-frontend-rehaan-tg.s3.ap-south-1.amazonaws.com/
   ```

2. **Make a small frontend change** (e.g., change a button label)

3. **Commit & push** to trigger Jenkins

4. **Refresh browser** → Changes should appear immediately ✅

---

## 🌐 Optional: Add CloudFront Later

CloudFront provides:
- Global CDN caching (faster for users worldwide)
- HTTPS with custom domain
- Automatic cache invalidation integration

To add CloudFront:

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name hospital-frontend-rehaan-tg.s3.ap-south-1.amazonaws.com \
  --default-root-object index.html
```

Then:
- Update Jenkinsfile with Distribution ID
- Enable cache invalidation
- Point your domain to CloudFront

---

## 🆘 Troubleshooting

### "Access Denied" from Jenkins
- Check IAM permissions (see section 3 above)
- Verify Jenkins is using correct AWS credentials

### Changes not visible after deployment
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Check browser DevTools cache
- Verify index.html has correct cache headers

### CORS errors when calling backend
- Configure backend CORS to allow frontend domain
- In your Express server:
  ```javascript
  app.use(cors({
    origin: 'https://hospital-frontend-rehaan-tg.s3.ap-south-1.amazonaws.com'
  }));
  ```

### S3 bucket not accessible publicly
- Enable public access in bucket settings
- Apply bucket policy (see section 2)
- Check security group/firewall rules

---

## 📋 Next Steps

1. **Enable Static Website Hosting** on S3 bucket
2. **Apply bucket policy** for public access
3. **Verify Jenkins IAM permissions**
4. **Commit these changes** to trigger pipeline
5. **Test** by making a frontend change
6. **(Optional) Add CloudFront** for global distribution

---

## 📚 Useful Commands

```bash
# View S3 bucket policy
aws s3api get-bucket-policy --bucket hospital-frontend-rehaan-tg

# List all objects and their sizes
aws s3 ls s3://hospital-frontend-rehaan-tg --recursive --human-readable

# Clear local cache and test
curl -I https://hospital-frontend-rehaan-tg.s3.ap-south-1.amazonaws.com/index.html

# Check all uploaded cache headers
aws s3api list-objects-v2 --bucket hospital-frontend-rehaan-tg --query 'Contents[*].Key' --output text | xargs -I {} aws s3api head-object --bucket hospital-frontend-rehaan-tg --key {} --query "CacheControl"
```

---

## 🎯 Your Architecture Now

```
┌─────────────────────────────────────────────────────┐
│ Browser                                             │
│ ├─ Loads index.html from S3                        │
│ ├─ Loads JS/CSS/images (versioned, cached 1 year) │
│ └─ API calls → EKS backend                         │
└─────────────────────────────────────────────────────┘
          ↓
    ┌─────────────┐        ┌──────────────────┐
    │ S3 Bucket   │        │  EKS Cluster     │
    │ (Frontend)  │        │  (Backend API)   │
    │  Static files        │  Express.js      │
    │ Cache: 1h/1y│        │  MySQL           │
    └─────────────┘        └──────────────────┘
          ↑                        ↑
          └────── Jenkins ─────────┘
               (Deploys)
```

---

Ready to deploy! 🚀
