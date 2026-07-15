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

resource "aws_vpc" "existing" {
  cidr_block           = data.aws_vpc.existing.cidr_block
  enable_dns_support   = data.aws_vpc.existing.enable_dns_support
  enable_dns_hostnames = data.aws_vpc.existing.enable_dns_hostnames
  tags                 = data.aws_vpc.existing.tags

  lifecycle {
    prevent_destroy = true
    ignore_changes  = all
  }
}

resource "aws_security_group" "backend" {
  name        = data.aws_security_group.backend.name
  description = data.aws_security_group.backend.description
  vpc_id      = data.aws_security_group.backend.vpc_id
  tags        = data.aws_security_group.backend.tags

  lifecycle {
    prevent_destroy = true
    ignore_changes  = all
  }
}

resource "aws_security_group" "rds" {
  name        = data.aws_security_group.rds.name
  description = data.aws_security_group.rds.description
  vpc_id      = data.aws_security_group.rds.vpc_id
  tags        = data.aws_security_group.rds.tags

  lifecycle {
    prevent_destroy = true
    ignore_changes  = all
  }
}

resource "aws_instance" "backend" {
  ami           = data.aws_instance.backend.ami
  instance_type = data.aws_instance.backend.instance_type
  tags          = data.aws_instance.backend.tags

  lifecycle {
    prevent_destroy = true
    ignore_changes  = all
  }
}

resource "aws_db_instance" "main" {
  identifier          = var.rds_identifier
  allocated_storage   = 20
  engine              = "mysql"
  instance_class      = var.db_instance_class
  username            = var.db_username
  password            = var.db_password
  db_name             = var.db_name
  publicly_accessible = true
  skip_final_snapshot = true

  lifecycle {
    prevent_destroy = true
    ignore_changes  = all
  }
}

resource "aws_s3_bucket" "frontend" {
  bucket = data.aws_s3_bucket.frontend.bucket

  lifecycle {
    prevent_destroy = true
    ignore_changes  = all
  }
}
