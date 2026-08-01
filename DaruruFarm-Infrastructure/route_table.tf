// route_table.tf
// Route Table for the VPC with default route to Internet Gateway
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  // Default route to IGW for internet access
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Project     = "DaruruFarm"
    Environment = "Dev"
    ManagedBy   = "Terraform"
    Name        = "${var.project_name}-public-rt"
  }
}

// Associate the route table with the public subnet
resource "aws_route_table_association" "public_subnet" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}
