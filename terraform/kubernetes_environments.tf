data "aws_eks_cluster" "target" {
  count = var.create_k8s_environments ? 1 : 0
  name  = var.eks_cluster_name
}

data "aws_eks_cluster_auth" "target" {
  count = var.create_k8s_environments ? 1 : 0
  name  = var.eks_cluster_name
}

provider "kubernetes" {
  host = var.create_k8s_environments ? data.aws_eks_cluster.target[0].endpoint : "https://127.0.0.1"

  token = var.create_k8s_environments ? data.aws_eks_cluster_auth.target[0].token : ""

  cluster_ca_certificate = var.create_k8s_environments ? base64decode(
    data.aws_eks_cluster.target[0].certificate_authority[0].data
  ) : ""
}

resource "kubernetes_namespace" "environments" {
  for_each = var.create_k8s_environments ? toset(var.environment_namespaces) : toset([])

  metadata {
    name = each.value

    labels = {
      environment = each.value
      managed-by  = "terraform"
      project     = var.project_name
    }
  }
}
