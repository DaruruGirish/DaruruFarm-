resource "aws_secretsmanager_secret" "app" {
  name                    = "${local.name_prefix}/app"
  description             = "DaruruFarm application secrets"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id
  secret_string = jsonencode({
    DB_HOST                 = aws_db_instance.mysql.address
    DB_PORT                 = tostring(aws_db_instance.mysql.port)
    DB_USERNAME             = var.db_username
    DB_PASSWORD             = random_password.db.result
    DB_DATABASE             = var.db_name
    JWT_SECRET              = random_password.jwt.result
    S3_BUCKET               = aws_s3_bucket.uploads.bucket
    AWS_REGION              = var.aws_region
    POMEGRANATE_INFER_URL   = "http://ml:8001"
    TYPEORM_SYNCHRONIZE     = "true"
    NODE_ENV                = "production"
    GOOGLE_CLIENT_ID        = ""
    RAZORPAY_KEY_ID         = ""
    RAZORPAY_KEY_SECRET     = ""
    VITE_GOOGLE_CLIENT_ID   = ""
  })
}
