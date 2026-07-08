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
When code is pushed to main, the workflow builds apps/frontend and deploys to S3.

Required repository secrets:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION
- S3_BUCKET_NAME

## Security
Do not commit real credentials. Use .env files locally and GitHub Actions secrets in CI.
