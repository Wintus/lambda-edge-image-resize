provider "aws" {
  region = "${var.main_aws_region}"
}

provider "aws" {
  alias  = "nova"
  region = "us-east-1"
}
