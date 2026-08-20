locals {
  name_prefix = "${var.project_name}-${var.environment}"
  azs         = slice(data.aws_availability_zones.available.names, 0, 2)

  enable_custom_domain = var.domain_name != ""
  zone_id              = local.enable_custom_domain ? (var.create_route53_zone ? aws_route53_zone.this[0].zone_id : var.route53_zone_id) : null

  common_tags = {
    Name = local.name_prefix
  }
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
