variable "main_aws_region" {
  default = "ap-northeast-1"
}

# output from serverless
variable "OriginResponseLambdaFunctionQualifiedArn" {}

variable "origin_s3_bucket_name" {
  default = "image-resize.wintus.tokyo"
}
