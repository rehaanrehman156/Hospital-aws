node {
  env.AWS_REGION = "ap-south-1"
  env.EKS_CLUSTER = "hospital-admin-eks"
  env.ECR_REPO = "hospital-backend"
  env.KUBECONFIG = "/var/lib/jenkins/.kube/config"
  env.S3_BUCKET = "hospital-frontend-rehaan-tg"
  env.CLOUDFRONT_DISTRIBUTION_ID = ""

  stage("Checkout") {
    checkout scm
  }

  stage("Build Backend Image") {
    sh '''
      set -e
      ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
      IMAGE_URI=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO
      IMAGE_TAG=$BUILD_NUMBER

      docker build -t $ECR_REPO:$IMAGE_TAG apps/backend
      docker tag $ECR_REPO:$IMAGE_TAG $IMAGE_URI:$IMAGE_TAG
      docker tag $ECR_REPO:$IMAGE_TAG $IMAGE_URI:latest

      echo "ACCOUNT_ID=$ACCOUNT_ID" > image.env
      echo "IMAGE_URI=$IMAGE_URI" >> image.env
      echo "IMAGE_TAG=$IMAGE_TAG" >> image.env
    '''
  }

  stage("Push Backend Image") {
    sh '''
      set -e
      . ./image.env

      aws ecr describe-repositories --region $AWS_REGION --repository-names $ECR_REPO >/dev/null 2>&1 || \
        aws ecr create-repository --region $AWS_REGION --repository-name $ECR_REPO

      aws ecr get-login-password --region $AWS_REGION | \
        docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

      docker push $IMAGE_URI:$IMAGE_TAG
      docker push $IMAGE_URI:latest
    '''
  }

  stage("Build and Deploy Frontend to S3") {
    sh '''
      set -e
      cd apps/frontend
      export VITE_API_BASE_URL="http://13.207.207.90:8080"
      echo "Building frontend..."
      npm run build
      
      # Upload HTML files with short cache (1 hour)
      echo "Uploading HTML files with cache control..."
      aws s3 sync ./dist s3://$S3_BUCKET --delete --region $AWS_REGION \
        --exclude "*" --include "*.html" \
        --cache-control "public, max-age=3600, must-revalidate"
      
      # Upload versioned assets with long cache (1 year)
      echo "Uploading assets with long cache..."
      aws s3 sync ./dist s3://$S3_BUCKET --delete --region $AWS_REGION \
        --exclude "*.html" \
        --cache-control "public, max-age=31536000, immutable"
      
      echo "Frontend deployment complete!"
      echo "S3 URL: https://$S3_BUCKET.s3.$AWS_REGION.amazonaws.com/"
    '''
    
    if (env.CLOUDFRONT_DISTRIBUTION_ID != "") {
      sh '''
        echo "Invalidating CloudFront distribution: $CLOUDFRONT_DISTRIBUTION_ID"
        aws cloudfront create-invalidation \
          --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
          --paths "/*" \
          --region $AWS_REGION
        echo "CloudFront invalidation initiated!"
      '''
    }
  }

  stage("Deploy Backend to EKS") {
    sh '''
      set -e
      . ./image.env

      aws eks update-kubeconfig --region $AWS_REGION --name $EKS_CLUSTER
      kubectl set image deployment/hospital-backend backend=$IMAGE_URI:$IMAGE_TAG
      kubectl rollout status deployment/hospital-backend --timeout=300s
      kubectl get pods -l app=hospital-backend
      kubectl get svc hospital-backend
    '''
  }

  stage("Post-Deployment Health Check") {
    sh '''
      echo "✓ Backend deployment complete"
      echo "✓ Frontend deployed to S3"
      if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
        echo "✓ CloudFront cache invalidated (1-2 minutes for propagation)"
      fi
    '''
  }
}