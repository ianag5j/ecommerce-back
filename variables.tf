# Input variable definitions

variable "aws_region" {
  description = "AWS region for all resources."

  type    = string
  default = "us-east-1"
}

variable "aws_account_id" {
  description = "AWS account id."

  type    = string
  default = "197373923794"
}
