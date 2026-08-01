// igw.tf
// Internet Gateway attached to the VPC
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Project     = "DaruruFarm"
    Environment = "Dev"
    ManagedBy   = "Terraform"
    Name        = "${var.project_name}-igw"
  }
}
