# ############ DYNAMODB ############
resource "aws_dynamodb_table" "products-dynamodb-table" {
  name           = "${terraform.workspace}Products"
  billing_mode   = "PROVISIONED"
  read_capacity  = 20
  write_capacity = 20
  hash_key       = "Id"
  range_key      = "Name"

  attribute {
    name = "Id"
    type = "S"
  }

  attribute {
    name = "Name"
    type = "S"
  }

  attribute {
    name = "UserId"
    type = "S"
  }

  global_secondary_index {
    name               = "UserIdIndex"
    hash_key           = "UserId"
    write_capacity     = 10
    read_capacity      = 10
    projection_type    = "INCLUDE"
    non_key_attributes = ["Id", "Name"]
  }


  tags = {
    Name        = "dynamodb-products-table"
    Environment = terraform.workspace
  }
}


# ############ LAMBDA ############

resource "aws_lambda_function" "getProducts" {
  function_name = "${terraform.workspace}GetProducts"

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_object.lambda_hello_world.key

  runtime = "nodejs14.x"
  handler = "products.getProducts"

  source_code_hash = data.archive_file.lambda_hello_world.output_base64sha256

  role = aws_iam_role.lambda_exec.arn
  environment {
    variables = {
      PRODUCTS_TABLE = aws_dynamodb_table.products-dynamodb-table.name
    }
  }
}

resource "aws_lambda_permission" "api_gw_get_products" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.getProducts.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.lambda.execution_arn}/*/*"
}

resource "aws_cloudwatch_log_group" "getProducts" {
  name = "/aws/lambda/${aws_lambda_function.getProducts.function_name}"

  retention_in_days = 30
}

# ############ API GATEWAY ############

resource "aws_apigatewayv2_integration" "getProducts" {
  api_id = aws_apigatewayv2_api.lambda.id

  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.getProducts.invoke_arn
}

resource "aws_apigatewayv2_route" "getProducts" {
  api_id = aws_apigatewayv2_api.lambda.id

  route_key = "GET /products"
  target    = "integrations/${aws_apigatewayv2_integration.getProducts.id}"
}
