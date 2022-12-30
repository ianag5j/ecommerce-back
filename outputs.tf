# Output value definitions

output "lambda_bucket_name" {
  description = "Name of the S3 bucket used to store function code."

  value = aws_s3_bucket.lambda_bucket.id
}

output "function_name_saveCredentials" {
  description = "Name of the Lambda function."

  value = aws_lambda_function.saveCredentials.function_name
}

output "base_url" {
  description = "Base URL for API Gateway stage."

  value = aws_apigatewayv2_stage.lambda.invoke_url
}

output "dynamodb_table" {
  description = "Dynamo Table."

  value = aws_dynamodb_table.basic-dynamodb-table.name
}

output "api_id" {
  description = "Api Id."

  value = aws_apigatewayv2_api.lambda.id
}

output "authorizer_id" {
  description = "Api Gateway Authorizer Id."

  value = aws_apigatewayv2_authorizer.authorizer.id
}
