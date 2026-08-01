// terraform.tfvars
// Provide values for variables defined in variables.tf

aws_region         = "ap-south-2"
project_name       = "DaruruFarm"
availability_zone  = "ap-south-2a"
key_pair_name      = "darurufarm"
vpc_cidr           = "10.0.0.0/16"
public_subnet_cidr = "10.0.1.0/24"
instance_type      = "t3.micro"
