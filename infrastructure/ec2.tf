resource "aws_instance" "app" {
  ami                         = data.aws_ami.al2023.id
  instance_type               = var.ec2_instance_type
  subnet_id                   = aws_subnet.public[0].id
  vpc_security_group_ids      = [aws_security_group.ec2.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2.name
  key_name                    = var.ec2_key_name != "" ? var.ec2_key_name : null
  associate_public_ip_address = true

  root_block_device {
    volume_size = var.ec2_root_volume_gb
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = templatefile("${path.module}/templates/user_data.sh.tftpl", {
    aws_region   = var.aws_region
    account_id   = data.aws_caller_identity.current.account_id
    secret_arn   = aws_secretsmanager_secret.app.arn
    ecr_frontend = aws_ecr_repository.frontend.repository_url
    ecr_backend  = aws_ecr_repository.backend.repository_url
    ecr_ml       = aws_ecr_repository.ml.repository_url
    s3_bucket    = aws_s3_bucket.uploads.bucket
    log_group    = aws_cloudwatch_log_group.app.name
  })

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  depends_on = [
    aws_secretsmanager_secret_version.app,
    aws_internet_gateway.this
  ]

  tags = {
    Name = "${local.name_prefix}-ec2"
  }

  lifecycle {
    ignore_changes = [ami, user_data]
  }
}

resource "aws_eip" "app" {
  count = var.enable_eip ? 1 : 0

  domain   = "vpc"
  instance = aws_instance.app.id

  tags = {
    Name = "${local.name_prefix}-eip"
  }

  depends_on = [aws_internet_gateway.this]
}
