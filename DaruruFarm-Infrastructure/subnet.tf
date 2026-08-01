// subnet.tf
// Creates a single public subnet in the specified availability zone
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = true

  tags = {
    Project     = "DaruruFarm"
    Environment = "Dev"
    ManagedBy   = "Terraform"
    Name        = "${var.project_name}-public-subnet"
  }
}
