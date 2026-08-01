// variables.tf
// Terraform input variables for Daruru Farm infrastructure

variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "ap-south-2"
}

variable "project_name" {
  description = "Project Name"
  type        = string
  default     = "DaruruFarm"
}

variable "availability_zone" {
  description = "Availability zone for resources"
  type        = string
}

variable "key_pair_name" {
  description = "Existing EC2 key pair name"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR for the public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}