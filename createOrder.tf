# ############ DYNAMODB ############
resource "aws_dynamodb_table" "orders-dynamodb-table" {
  name         = "${terraform.workspace}Orders"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Id"

  attribute {
    name = "Id"
    type = "S"
  }

  attribute {
    name = "StoreId"
    type = "S"
  }

  attribute {
    name = "ExternalId"
    type = "S"
  }

  global_secondary_index {
    name               = "StoreIdIndex"
    hash_key           = "StoreId"
    write_capacity     = 10
    read_capacity      = 10
    projection_type    = "INCLUDE"
    non_key_attributes = ["Id", "Status", "Amount", "ExternalId", "CreatedAt"]
  }

  global_secondary_index {
    name               = "ExternalIdIndex"
    hash_key           = "ExternalId"
    write_capacity     = 10
    read_capacity      = 10
    projection_type    = "INCLUDE"
    non_key_attributes = ["Id"]
  }


  tags = {
    Name        = "dynamodb-orders-table"
    Environment = terraform.workspace
  }
}


# ############ LAMBDA ############

resource "aws_lambda_function" "createOrder" {
  function_name = "${terraform.workspace}CreateOrder"

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_object.lambda_hello_world.key

  runtime = "nodejs14.x"
  handler = "orders.createOrder"
  timeout = 5

  source_code_hash = data.archive_file.lambda_hello_world.output_base64sha256

  role = aws_iam_role.lambda_exec.arn
  environment {
    variables = {
      ORDERS_TABLE   = aws_dynamodb_table.orders-dynamodb-table.name
      PRODUCTS_TABLE = aws_dynamodb_table.products-dynamodb-table.name
      CREDENTIALS_TABLE = aws_dynamodb_table.basic-dynamodb-table.name
      STORES_TABLE   = aws_dynamodb_table.stores-dynamodb-table.name
      # FRONT_BASE_URL = "http://localhost:3000"
      FRONT_BASE_URL = "https://ecommerce-front-git-development-iangonzalez-ualacomar.vercel.app"
      LAMBDA_URL = aws_apigatewayv2_stage.lambda.invoke_url
    }
  }
}

resource "aws_lambda_permission" "api_gw_create_order" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.createOrder.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.lambda.execution_arn}/*/*"
}

resource "aws_cloudwatch_log_group" "createOrder" {
  name = "/aws/lambda/${aws_lambda_function.createOrder.function_name}"

  retention_in_days = 30
}

# ############ API GATEWAY ############

resource "aws_apigatewayv2_integration" "createOrder" {
  api_id = aws_apigatewayv2_api.lambda.id

  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.createOrder.invoke_arn
}

resource "aws_apigatewayv2_route" "createOrder" {
  api_id = aws_apigatewayv2_api.lambda.id

  route_key          = "POST /orders"
  target             = "integrations/${aws_apigatewayv2_integration.createOrder.id}"
  # authorizer_id      = aws_apigatewayv2_authorizer.authorizer.id
  # authorization_type = "JWT"
}
