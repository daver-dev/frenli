data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "main" {
  bucket = "frenli-images-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "main"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "bucket_privacy" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "cors_config" {
  bucket = aws_s3_bucket.main.id
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = var.media_cors_allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
