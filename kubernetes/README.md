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
	- Build and push `apps/backend/Dockerfile` image to ECR with two tags:
		- Immutable release tag (for traceability), e.g. `20260710-120000`
		- Stable runtime tag `prod` (used by the Kubernetes deployment)
2. Create backend secret from template:
	- Copy `kubernetes/backend-secret.example.yaml` to `kubernetes/backend-secret.yaml`
	- Fill real DB values
3. Apply manifests:
	- `kubectl apply -f kubernetes/backend-secret.yaml`
	- `kubectl apply -f kubernetes/backend-eks-deployment.yaml`
	- `kubectl apply -f kubernetes/backend-hpa.yaml`
4. Bind deployment to your ECR URI (one-time):
	- `kubectl set image deployment/hospital-backend backend=<ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/hospital-backend:prod`
5. For each release:
	- Push the immutable image tag and also push/update the `prod` tag
	- `kubectl rollout restart deployment/hospital-backend`

## Verify

- `kubectl get pods -l app=hospital-backend`
- `kubectl get svc hospital-backend`
- `kubectl get hpa hospital-backend`
- `kubectl describe deployment hospital-backend`

When the service `EXTERNAL-IP` is assigned, use that URL for the frontend API base URL.
