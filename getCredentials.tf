# ############ LAMBDA ############

resource "aws_lambda_function" "getCredentials" {
  function_name = "${terraform.workspace}GetCredentials"

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_object.lambda_hello_world.key

  runtime = "nodejs14.x"
  handler = "handler.getCredentials"

  source_code_hash = data.archive_file.lambda_hello_world.output_base64sha256

  role = aws_iam_role.lambda_exec.arn
  environment {
    variables = {
      CREDENTIALS_TABLE = aws_dynamodb_table.basic-dynamodb-table.name
    }
  }
}

resource "aws_cloudwatch_log_group" "getCredentials" {
  name = "/aws/lambda/${aws_lambda_function.getCredentials.function_name}"

  retention_in_days = 30
}

resource "aws_apigatewayv2_integration" "getCredentials" {
  api_id = aws_apigatewayv2_api.lambda.id

  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.getCredentials.invoke_arn
}

resource "aws_apigatewayv2_route" "getCredentials" {
  api_id = aws_apigatewayv2_api.lambda.id

  route_key = "GET /credentials"
  target    = "integrations/${aws_apigatewayv2_integration.getCredentials.id}"
}

resource "aws_lambda_permission" "api_gw_get_credentials" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.getCredentials.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.lambda.execution_arn}/*/*"
}
