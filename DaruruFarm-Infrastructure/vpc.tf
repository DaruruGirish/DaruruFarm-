resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Project     = "DaruruFarm"
    Environment = "Dev"
    ManagedBy   = "Terraform"
    Name        = "${var.project_name}-vpc"
  }
}
