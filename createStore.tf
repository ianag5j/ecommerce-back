
# ############ LAMBDA ############

resource "aws_lambda_function" "createStore" {
  function_name = "${terraform.workspace}CreateStore"

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_object.lambda_hello_world.key

  runtime = "nodejs14.x"
  handler = "store.createStore"

  source_code_hash = data.archive_file.lambda_hello_world.output_base64sha256

  role = aws_iam_role.lambda_exec.arn
  environment {
    variables = {
      STORES_TABLE = "${terraform.workspace}Stores"
    }
  }
}

resource "aws_lambda_permission" "api_gw_create_store" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.createStore.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.lambda.execution_arn}/*/*"
}

resource "aws_cloudwatch_log_group" "createStore" {
  name = "/aws/lambda/${aws_lambda_function.createStore.function_name}"

  retention_in_days = 30
}

# ############ API GATEWAY ############

resource "aws_apigatewayv2_integration" "createStore" {
  api_id = aws_apigatewayv2_api.lambda.id

  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.createStore.invoke_arn
}

resource "aws_apigatewayv2_route" "createStore" {
  api_id = aws_apigatewayv2_api.lambda.id

  route_key = "POST /stores"
  target    = "integrations/${aws_apigatewayv2_integration.createStore.id}"
}
