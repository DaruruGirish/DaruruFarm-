aws_region       = "ap-south-2"
project_name     = "darurufarm"
environment      = "prod"
ec2_instance_type = "m7i-flex.large"
ec2_key_name     = "darurufarm"
db_instance_class = "db.t4g.micro"

# Leave empty until you own a domain. ALB HTTP DNS will be used.
# domain_name = "example.com"
# create_route53_zone = true

# Optional: lock SSH to your IP, e.g. "1.2.3.4/32"
allowed_ssh_cidr = ""
