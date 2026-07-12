node {
env.AWS_REGION = "ap-south-1"
env.EKS_CLUSTER = "hospital-admin-eks"
env.ECR_REPO = "hospital-backend"
env.KUBECONFIG = "/var/lib/jenkins/.kube/config"

stage("Checkout") {
checkout scm
}

stage("Build and Push Image") {
sh '''
set -e
  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  IMAGE_URI=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO
  IMAGE_TAG=$BUILD_NUMBER

  aws ecr describe-repositories --region $AWS_REGION --repository-names $ECR_REPO >/dev/null 2>&1 || \
  aws ecr create-repository --region $AWS_REGION --repository-name $ECR_REPO

  aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

  docker build -t $ECR_REPO:$IMAGE_TAG apps/backend
  docker tag $ECR_REPO:$IMAGE_TAG $IMAGE_URI:$IMAGE_TAG
  docker tag $ECR_REPO:$IMAGE_TAG $IMAGE_URI:latest

  docker push $IMAGE_URI:$IMAGE_TAG
  docker push $IMAGE_URI:latest

  echo "IMAGE_URI=$IMAGE_URI" > image.env
  echo "IMAGE_TAG=$IMAGE_TAG" >> image.env
'''}

stage("Deploy to EKS") {
sh '''
set -e
. image.env

aws eks update-kubeconfig --region $AWS_REGION --name $EKS_CLUSTER
kubectl set image deployment/hospital-backend backend=$IMAGE_URI:$IMAGE_TAG
kubectl rollout status deployment/hospital-backend --timeout=300s
kubectl get pods -l app=hospital-backend
kubectl get svc hospital-backend
'''
}
}
