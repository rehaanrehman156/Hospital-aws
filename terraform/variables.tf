variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Prefix used for Terraform-managed resource names."
  type        = string
  default     = "hospital-admin"
}

variable "frontend_bucket_name" {
  description = "Globally unique S3 bucket name for frontend static website."
  type        = string
}

variable "existing_vpc_id" {
  description = "Existing VPC ID to import into Terraform."
  type        = string
}

variable "backend_ec2_instance_id" {
  description = "Existing backend EC2 instance ID to import into Terraform."
  type        = string
}

variable "backend_security_group_id" {
  description = "Existing backend EC2 security group ID to import into Terraform."
  type        = string
}

variable "rds_identifier" {
  description = "Existing RDS instance identifier to import into Terraform."
  type        = string
}

variable "rds_security_group_id" {
  description = "Existing RDS security group ID to import into Terraform."
  type        = string
}

variable "ec2_instance_type" {
  description = "Backend EC2 instance type."
  type        = string
  default     = "t3.micro"
}

variable "ec2_key_name" {
  description = "Existing EC2 key pair name for SSH access."
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to SSH into backend EC2."
  type        = string
  default     = "0.0.0.0/0"
}

variable "allowed_backend_cidr" {
  description = "CIDR allowed to reach backend API on port 8080."
  type        = string
  default     = "0.0.0.0/0"
}

variable "db_name" {
  description = "MySQL database name."
  type        = string
  default     = "hospital_app"
}

variable "db_username" {
  description = "RDS master username."
  type        = string
  default     = "admin"
}

variable "db_password" {
  description = "RDS master password."
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t3.micro"
}
