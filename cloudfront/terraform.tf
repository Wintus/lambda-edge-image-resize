terraform {
  required_version = "~> 0.11"

  backend "s3" {
    region = "ap-northeast-1"
    bucket = "infra.wintus.tokyo"
    key    = "lambda-edge-image-resize"
  }
}
