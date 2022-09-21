# ############ LAMBDA ############

resource "aws_lambda_function" "webhookOrder" {
  function_name = "${terraform.workspace}WebhookOrder"

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_object.lambda_hello_world.key

  runtime = "nodejs14.x"
  handler = "orders.webhook"

  source_code_hash = data.archive_file.lambda_hello_world.output_base64sha256

  role = aws_iam_role.lambda_exec.arn
  environment {
    variables = {
      ORDERS_TABLE = aws_dynamodb_table.orders-dynamodb-table.name
    }
  }
}

resource "aws_lambda_permission" "api_gw_webhook_order" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.webhookOrder.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.lambda.execution_arn}/*/*"
}

resource "aws_cloudwatch_log_group" "webhookOrder" {
  name = "/aws/lambda/${aws_lambda_function.webhookOrder.function_name}"

  retention_in_days = 30
}

# ############ API GATEWAY ############

resource "aws_apigatewayv2_integration" "webhookOrder" {
  api_id = aws_apigatewayv2_api.lambda.id

  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.webhookOrder.invoke_arn
}

resource "aws_apigatewayv2_route" "webhookOrder" {
  api_id = aws_apigatewayv2_api.lambda.id

  route_key = "POST /webhook/order/{orderId}"
  target    = "integrations/${aws_apigatewayv2_integration.webhookOrder.id}"
}
