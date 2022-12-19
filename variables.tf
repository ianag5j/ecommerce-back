# Input variable definitions

variable "aws_region" {
  description = "AWS region for all resources."

  type    = string
  default = "us-east-1"
}

variable "auth0_domain" {
  description = "auth0 domain url."

  type = string
}
