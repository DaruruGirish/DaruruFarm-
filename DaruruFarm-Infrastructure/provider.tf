// provider.tf
// AWS provider configuration (v6.x)
provider "aws" {
  // Region is supplied via variable "aws_region"
  region = var.aws_region
}
