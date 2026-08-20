output "vpc_id" {
  value = aws_vpc.this.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "ec2_instance_id" {
  value = aws_instance.app.id
}

output "ec2_public_ip" {
  value = var.enable_eip ? aws_eip.app[0].public_ip : aws_instance.app.public_ip
}

output "app_url" {
  value = (
    local.enable_custom_domain ? "https://${var.domain_name}" :
    var.enable_alb ? "http://${aws_lb.app[0].dns_name}" :
    "http://${var.enable_eip ? aws_eip.app[0].public_ip : aws_instance.app.public_ip}"
  )
  description = "URL to open the app (IP changes on stop/start when EIP is disabled)"
}

output "alb_dns_name" {
  value = var.enable_alb ? aws_lb.app[0].dns_name : null
}

output "rds_endpoint" {
  value = aws_db_instance.mysql.address
}

output "s3_uploads_bucket" {
  value = aws_s3_bucket.uploads.bucket
}

output "ecr_frontend_url" {
  value = aws_ecr_repository.frontend.repository_url
}

output "ecr_backend_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "ecr_ml_url" {
  value = aws_ecr_repository.ml.repository_url
}

output "ecr_repository_names" {
  value = {
    frontend = local.ecr_frontend_name
    backend  = local.ecr_backend_name
    ml       = local.ecr_ml_name
  }
}

output "secrets_arn" {
  value = aws_secretsmanager_secret.app.arn
}

output "cloudwatch_log_group" {
  value = aws_cloudwatch_log_group.app.name
}

output "route53_name_servers" {
  value       = local.enable_custom_domain && var.create_route53_zone ? aws_route53_zone.this[0].name_servers : []
  description = "Point your domain registrar to these NS records when using a custom domain"
}

output "free_tier_notes" {
  value = [
    "ALB disabled (enable_alb=false) to avoid hourly ELB charges",
    "EIP disabled (enable_eip=false) so stopped instances do not accrue idle EIP charges",
    "NAT Gateway omitted",
    "Stop EC2 + RDS when not testing",
  ]
}
