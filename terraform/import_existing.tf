// Read-only lookups for legacy AWS resources that are still used by the lab.
// These stay as data sources so Terraform does not pretend to manage imported
// infrastructure that is outside the current GitOps/EKS workflow.
data "aws_vpc" "existing" {
  id = var.existing_vpc_id
}

data "aws_security_group" "backend" {
  id = var.backend_security_group_id
}

data "aws_security_group" "rds" {
  id = var.rds_security_group_id
}

data "aws_instance" "backend" {
  instance_id = var.backend_ec2_instance_id
}

data "aws_db_instance" "main" {
  db_instance_identifier = var.rds_identifier
}

data "aws_s3_bucket" "frontend" {
  bucket = var.frontend_bucket_name
}
