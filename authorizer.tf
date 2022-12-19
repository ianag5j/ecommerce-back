# ############ LAMBDA ############

resource "aws_lambda_function" "authorizer" {
  function_name = "${terraform.workspace}Authorizer"

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_object.lambda_hello_world.key

  runtime = "nodejs14.x"
  handler = "authorizer.handler"

  source_code_hash = data.archive_file.lambda_hello_world.output_base64sha256

  role = aws_iam_role.lambda_exec.arn
  environment {
    variables = {
      AUTH0_DOMAIN = var.auth0_domain
    }
  }
}

resource "aws_cloudwatch_log_group" "authorizer" {
  name = "/aws/lambda/${aws_lambda_function.authorizer.function_name}"

  retention_in_days = 30
}

# ############ API GATEWAY ############

resource "aws_apigatewayv2_authorizer" "customAuthorizer" {
  api_id                            = aws_apigatewayv2_api.lambda.id
  authorizer_payload_format_version = "2.0"
  authorizer_uri                    = aws_lambda_function.authorizer.invoke_arn
  authorizer_type                   = "REQUEST"
  identity_sources                  = ["$request.header.Authorization"]
  name                              = "ecommerce-custom-authorizer"
  enable_simple_responses           = true
}
