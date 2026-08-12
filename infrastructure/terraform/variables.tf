variable "aws_region" {
    description = "The AWS region yo."
    type = string
    default = "us-east-1"
}

variable "environment" {
    description = "Which environment to deploy to. Used for resource names."
    type = string
    default = "dev"
}

variable "media_cors_allowed_origins" {
  description = "Origins allowed to read/write the media bucket via pre-signed URLs."
  type        = list(string)
  default     = ["http://localhost:8081"]
}
