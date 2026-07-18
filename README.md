# Hospital Admin Monorepo

This repository is organized as a monorepo with separate frontend and backend apps.

## Repository Layout
- apps/frontend: React + Vite admin dashboard
- apps/backend: Express + MySQL API
- .github/workflows: CI/CD workflows

## Prerequisites
- Node.js 18+
- npm 9+
- MySQL database
- AWS CLI (optional, for manual S3 deploy)

## Install Dependencies
```bash
npm install
```

## Environment Setup
1. Frontend variables:
   - Copy apps/frontend/.env.example to apps/frontend/.env
2. Backend variables:
   - Copy apps/backend/.env.example to apps/backend/.env

## Run Apps
```bash
npm run dev:frontend
npm run dev:backend
```

Frontend default URL: http://localhost:5173
Backend default URL: http://localhost:8080

## Build Frontend
```bash
npm run build:frontend
```

## Deploy Frontend to S3 (manual)
```bash
npm run deploy:s3 --workspace @hospital/frontend -- --BucketName YOUR_BUCKET_NAME
```

## GitHub Actions Deploy
When code is pushed to `main`, the workflow:
- builds frontend (`apps/frontend`)
- deploys frontend to S3 with cache headers
- optionally invalidates CloudFront
- builds backend Docker image and pushes to ECR
- updates `kubernetes/backend-eks-deployment.yaml` image tag for Argo CD GitOps sync

Required repository secrets:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION
- S3_BUCKET_NAME
- VITE_API_BASE_URL
- ECR_REPOSITORY

Optional frontend secret:
- CLOUDFRONT_DISTRIBUTION_ID

## Argo CD + EKS Auto
1. Install Argo CD in your EKS Auto cluster.
2. Apply `kubernetes/backend-secret.yaml` with real DB credentials.
3. Apply `kubernetes/backend-hpa.yaml` for backend autoscaling.
4. Apply `kubernetes/argocd-application.yaml`.
5. Argo CD will watch `kubernetes/backend-eks-deployment.yaml` and sync backend automatically.

## Security
Do not commit real credentials. Use .env files locally and GitHub Actions secrets in CI.

## Terraform: Dev and Stage Namespaces
To create `dev` and `stage` namespaces in EKS via Terraform:

1. Open `terraform/terraform.tfvars` and set:
   - `create_k8s_environments = true`
   - `eks_cluster_name = "hospital-admin-eks-auto"` (or your cluster)
   - `environment_namespaces = ["dev", "stage"]`
2. Run:
   - `terraform -chdir=terraform init`
   - `terraform -chdir=terraform plan`
   - `terraform -chdir=terraform apply`
3. Verify:
   - `kubectl get ns`
