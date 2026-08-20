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
  value = aws_eip.app.public_ip
}

output "alb_dns_name" {
  value       = aws_lb.app.dns_name
  description = "Open http://<alb_dns_name> until a custom domain is configured"
}

output "alb_url" {
  value = local.enable_custom_domain ? "https://${var.domain_name}" : "http://${aws_lb.app.dns_name}"
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

output "note_no_nat" {
  value = "NAT Gateway omitted: EC2 is in a public subnet; RDS stays private. Saves ~$32/month."
}
