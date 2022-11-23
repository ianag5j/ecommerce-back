# ############ LAMBDA ############

resource "aws_lambda_function" "getOrders" {
  function_name = "${terraform.workspace}GetOrders"

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_object.lambda_hello_world.key

  runtime = "nodejs14.x"
  handler = "orders.getOrders"

  source_code_hash = data.archive_file.lambda_hello_world.output_base64sha256

  role = aws_iam_role.lambda_exec.arn
  environment {
    variables = {
      ORDERS_TABLE   = aws_dynamodb_table.orders-dynamodb-table.name
      PRODUCTS_TABLE = aws_dynamodb_table.products-dynamodb-table.name
    }
  }
}

resource "aws_lambda_permission" "api_gw_get_orders" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.getOrders.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.lambda.execution_arn}/*/*"
}

resource "aws_cloudwatch_log_group" "getOrders" {
  name = "/aws/lambda/${aws_lambda_function.getOrders.function_name}"

  retention_in_days = 30
}

# ############ API GATEWAY ############

resource "aws_apigatewayv2_integration" "getOrders" {
  api_id = aws_apigatewayv2_api.lambda.id

  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.getOrders.invoke_arn
}

resource "aws_apigatewayv2_route" "getOrders" {
  api_id = aws_apigatewayv2_api.lambda.id

  route_key          = "GET /orders"
  target             = "integrations/${aws_apigatewayv2_integration.getOrders.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.customAuthorizer.id
  authorization_type = "CUSTOM"
}
