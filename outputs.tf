# Output value definitions

output "lambda_bucket_name" {
  description = "Name of the S3 bucket used to store function code."

  value = aws_s3_bucket.lambda_bucket.id
}

output "base_url" {
  description = "Base URL for API Gateway stage."

  value = aws_apigatewayv2_stage.lambda.invoke_url
}

output "api_id" {
  description = "Api Id."

  value = aws_apigatewayv2_api.lambda.id
}

output "authorizer_id" {
  description = "Api Gateway Authorizer Id."

  value = aws_apigatewayv2_authorizer.customAuthorizer.id
}
