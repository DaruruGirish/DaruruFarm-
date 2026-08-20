locals {
  name_prefix = "${var.project_name}-${var.environment}"
  azs         = slice(data.aws_availability_zones.available.names, 0, 2)

  enable_custom_domain = var.domain_name != "" && var.enable_alb
  zone_id              = local.enable_custom_domain ? (var.create_route53_zone ? aws_route53_zone.this[0].zone_id : var.route53_zone_id) : null

  ecr_frontend_name = "${var.project_name}-frontend"
  ecr_backend_name  = "${var.project_name}-backend"
  ecr_ml_name       = "${var.project_name}-ml"
}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "aws_caller_identity" "current" {}
