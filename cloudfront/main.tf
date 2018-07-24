/*
CDN
*/

resource "aws_cloudfront_distribution" "image" {
  enabled = true

  origin {
    origin_id   = "${aws_s3_bucket.image_origin.id}"
    domain_name = "${aws_s3_bucket.image_origin.bucket_domain_name}"

    s3_origin_config {
      origin_access_identity = "${aws_cloudfront_origin_access_identity.image.cloudfront_access_identity_path}"
    }
  }

  default_cache_behavior {
    target_origin_id = "${aws_s3_bucket.image_origin.id}"

    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD"]

    lambda_function_association {
      event_type = "origin-response"
      lambda_arn = "${var.OriginResponseLambdaFunctionQualifiedArn}"
    }

    forwarded_values {
      query_string = true

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "allow-all"
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  price_class = "PriceClass_200"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags {
    Environment = "dev"
  }
}

resource "aws_cloudfront_origin_access_identity" "image" {
  comment = "Managed by Terraform"
}

/*
Origin
*/

resource "aws_s3_bucket" "image_origin" {
  bucket = "${var.origin_s3_bucket_name}"
}

resource "aws_s3_bucket_policy" "image_origin" {
  bucket = "${aws_s3_bucket.image_origin.id}"
  policy = "${data.aws_iam_policy_document.image_s3_origin.json}"
}

data "aws_iam_policy_document" "image_s3_origin" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.image_origin.arn}/*"]

    principals {
      type        = "AWS"
      identifiers = ["${aws_cloudfront_origin_access_identity.image.iam_arn}"]
    }
  }

  statement {
    actions   = ["s3:ListBucket"]
    resources = ["${aws_s3_bucket.image_origin.arn}"]

    principals {
      type        = "AWS"
      identifiers = ["${aws_cloudfront_origin_access_identity.image.iam_arn}"]
    }
  }
}
