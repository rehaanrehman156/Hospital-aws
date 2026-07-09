# Kubernetes

This folder contains Kubernetes manifests for the Hospital Admin project.

## EKS Setup

1. Re-authenticate AWS CLI:
	- `aws sso login` (for SSO profile) or `aws configure` (for access keys)
2. Verify account:
	- `aws sts get-caller-identity`
3. Create EKS cluster:
	- `eksctl create cluster -f kubernetes/eks-cluster.yaml`

## Backend Deployment On EKS

1. Create an ECR repo and push image:
	- `aws ecr create-repository --repository-name hospital-backend --region ap-south-1`
	- Build and push `apps/backend/Dockerfile` image to ECR
2. Create backend secret from template:
	- Copy `kubernetes/backend-secret.example.yaml` to `kubernetes/backend-secret.yaml`
	- Fill real DB values
3. Update backend deployment image:
	- Replace `YOUR_ECR_URI/hospital-backend:latest` in `kubernetes/backend-eks-deployment.yaml`
4. Apply manifests:
	- `kubectl apply -f kubernetes/backend-secret.yaml`
	- `kubectl apply -f kubernetes/backend-eks-deployment.yaml`

## Verify

- `kubectl get pods -l app=hospital-backend`
- `kubectl get svc hospital-backend`

When the service `EXTERNAL-IP` is assigned, use that URL for the frontend API base URL.
