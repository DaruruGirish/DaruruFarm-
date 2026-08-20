variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-2"
}

variable "project_name" {
  description = "Short project name used in resource names"
  type        = string
  default     = "darurufarm"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "VPC CIDR"
  type        = string
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDRs (2 AZs if ALB enabled)"
  type        = list(string)
  default     = ["10.20.1.0/24", "10.20.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDRs for RDS (no NAT)"
  type        = list(string)
  default     = ["10.20.11.0/24", "10.20.12.0/24"]
}

variable "ec2_instance_type" {
  description = "Free-tier eligible instance type with enough RAM for ML"
  type        = string
  default     = "m7i-flex.large"
}

variable "ec2_key_name" {
  description = "Existing EC2 key pair name for SSH emergency access"
  type        = string
  default     = "darurufarm"
}

variable "ec2_root_volume_gb" {
  description = "Root EBS size (free tier typically allows 30 GB)"
  type        = number
  default     = 30
}

variable "db_instance_class" {
  description = "RDS instance class (free-tier eligible)"
  type        = string
  default     = "db.t4g.micro"
}

variable "db_name" {
  description = "MySQL database name"
  type        = string
  default     = "daruru_farm"
}

variable "db_username" {
  description = "MySQL master username"
  type        = string
  default     = "daruru"
}

variable "enable_alb" {
  description = "Create ALB (costs money; keep false on free tier). Required for custom domain HTTPS."
  type        = bool
  default     = false
}

variable "enable_eip" {
  description = "Attach Elastic IP (charges when instance is stopped). Prefer false on free tier."
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Optional custom domain (requires enable_alb=true for ACM/HTTPS)"
  type        = string
  default     = ""
}

variable "create_route53_zone" {
  description = "Create a new public hosted zone for domain_name"
  type        = bool
  default     = true
}

variable "route53_zone_id" {
  description = "Existing hosted zone ID when create_route53_zone=false"
  type        = string
  default     = ""
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to SSH to EC2. Empty disables SSH ingress."
  type        = string
  default     = ""
}

variable "allowed_http_cidrs" {
  description = "CIDRs allowed to hit the app on EC2:80 when ALB is disabled"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
