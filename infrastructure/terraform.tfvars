aws_region          = "ap-south-2"
project_name        = "darurufarm"
environment         = "prod"
ec2_instance_type   = "m7i-flex.large"
ec2_key_name        = "darurufarm"
ec2_root_volume_gb  = 40
db_instance_class   = "db.t4g.micro"

# Free-tier defaults: no ALB (billable), no EIP (billable while stopped)
enable_alb = false
enable_eip = false

# When you have a domain AND are willing to pay for ALB:
# enable_alb = true
# domain_name = "example.com"

allowed_ssh_cidr = ""
allowed_http_cidrs = ["0.0.0.0/0"]
