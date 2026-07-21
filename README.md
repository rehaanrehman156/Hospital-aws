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

## GitHub Actions: DevSecOps + GitOps pipeline

### 1) PR Security Gates
These workflows run on pull requests and should be set as required checks:
- `.github/workflows/security.yml` (Trivy fs/config/image + Gitleaks)
- `.github/workflows/codeql.yml` (CodeQL analysis)
- `.github/workflows/sonarcloud.yml` (SonarCloud scan + quality gate)

### 2) Release and Dev Deployment (`deploy.yml`)
On push to `main`, the workflow:
- builds backend Docker image once and tags it with short commit SHA
- pushes image to ECR
- updates `kubernetes/dev/backend-deployment.yaml`
- commits that manifest change (with `[skip ci]`) for Argo CD sync
- builds frontend and deploys to S3 (optional if secrets are present)

### 3) Promotion Workflows
Manual workflows create pull requests so the same immutable image is promoted:
- `.github/workflows/promote-stage.yml`
  - source: `kubernetes/dev/backend-deployment.yaml`
  - target: `kubernetes/stage/backend-deployment.yaml`
- `.github/workflows/promote-prod.yml`
  - source: `kubernetes/stage/backend-deployment.yaml`
  - target: `kubernetes/backend-eks-deployment.yaml`

Required repository secrets:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION
- ECR_REPOSITORY
- SONAR_TOKEN

Required for frontend deploy:
- S3_BUCKET_NAME
- VITE_API_BASE_URL

Optional frontend secret:
- CLOUDFRONT_DISTRIBUTION_ID

## Argo CD + EKS Auto
1. Install Argo CD in your EKS Auto cluster.
2. Apply `kubernetes/backend-secret.yaml` with real DB credentials.
3. Apply `kubernetes/backend-hpa.yaml` for backend autoscaling.
4. Create Argo CD Applications for each environment path:
   - `kubernetes/dev`
   - `kubernetes/stage`
   - `kubernetes` (for `backend-eks-deployment.yaml` / prod)
5. Dev app can auto-sync; stage/prod should use approval before sync.

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
