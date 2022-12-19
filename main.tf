terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.2.0"
    }
  }

  backend "s3" {
    bucket = "terraform-state-ian"
    key    = "terraform"
    region = "us-east-1"
  }

  required_version = "~> 1.0"
}

provider "aws" {
  region = var.aws_region
}

resource "aws_s3_bucket" "lambda_bucket" {
  bucket = "ianag5j-ecommerce-back"
}

resource "aws_s3_bucket_public_access_block" "lambda_bucket" {
  bucket = aws_s3_bucket.lambda_bucket.id

  restrict_public_buckets = true
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
}

resource "aws_s3_bucket_acl" "bucket_acl" {
  bucket = aws_s3_bucket.lambda_bucket.id
  acl    = "private"
}

data "archive_file" "lambda_hello_world" {
  type = "zip"

  source_dir  = "${path.module}/src"
  output_path = "${path.module}/hello-world.zip"
}

resource "aws_s3_object" "lambda_hello_world" {
  bucket = aws_s3_bucket.lambda_bucket.id

  key    = "${terraform.workspace}/hello-world.zip"
  source = data.archive_file.lambda_hello_world.output_path

  etag = filemd5(data.archive_file.lambda_hello_world.output_path)
}

# ############ LAMBDA ############

# ----- saveCredentials -----
resource "aws_lambda_function" "saveCredentials" {
  function_name = "${terraform.workspace}SaveCredentials"

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_object.lambda_hello_world.key

  runtime = "nodejs14.x"
  handler = "credentials.saveCredentials"

  source_code_hash = data.archive_file.lambda_hello_world.output_base64sha256

  role = aws_iam_role.lambda_exec.arn
  environment {
    variables = {
      CREDENTIALS_TABLE = aws_dynamodb_table.basic-dynamodb-table.name
    }
  }
}

resource "aws_cloudwatch_log_group" "hello_world" {
  name = "/aws/lambda/${aws_lambda_function.saveCredentials.function_name}"

  retention_in_days = 30
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "lambda_policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:*",
        ],
        Resource = "arn:aws:dynamodb:us-east-1:197373923794:table/${terraform.workspace}Credentials"
      },
      {
        Effect = "Allow",
        Action = [
          "dynamodb:*",
        ],
        Resource = "arn:aws:dynamodb:${var.aws_region}:197373923794:table/${aws_dynamodb_table.products-dynamodb-table.name}*"
      },
      {
        Effect = "Allow",
        Action = [
          "dynamodb:*",
        ],
        Resource = "arn:aws:dynamodb:${var.aws_region}:197373923794:table/${aws_dynamodb_table.orders-dynamodb-table.name}*"
      },
      {
        Effect = "Allow",
        Action = [
          "dynamodb:*",
        ],
        Resource = "arn:aws:dynamodb:${var.aws_region}:197373923794:table/${aws_dynamodb_table.stores-dynamodb-table.name}*"
      },
      {
        Effect = "Allow",
        Action = [
          "cognito-idp:ListUsers",
        ],
        Resource = "arn:aws:cognito-idp:${var.aws_region}:197373923794:userpool/us-east-1_Bi6FQeFqv"
      },
    ]
  })
}

resource "aws_iam_role" "lambda_exec" {
  name                  = "${terraform.workspace}_serverless_lambda"
  force_detach_policies = true
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      },
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Sid    = ""
        Principal = {
          Service = "apigateway.amazonaws.com"
        },
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ############ API GATEWAY ############

resource "aws_apigatewayv2_api" "lambda" {
  name          = "${terraform.workspace}_ecommerce"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "lambda" {
  api_id = aws_apigatewayv2_api.lambda.id

  name        = terraform.workspace
  auto_deploy = true

  route_settings {
    route_key              = "dev"
    throttling_burst_limit = 50
    throttling_rate_limit  = 100
  }

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gw.arn

    format = jsonencode({
      requestId               = "$context.requestId"
      sourceIp                = "$context.identity.sourceIp"
      requestTime             = "$context.requestTime"
      protocol                = "$context.protocol"
      httpMethod              = "$context.httpMethod"
      resourcePath            = "$context.resourcePath"
      routeKey                = "$context.routeKey"
      status                  = "$context.status"
      responseLength          = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage",
      authError               = "$context.authorizer.error",
      authProperty            = "$context.authorizer.scope",
      }
    )
  }
}

resource "aws_apigatewayv2_integration" "hello_world" {
  api_id = aws_apigatewayv2_api.lambda.id

  integration_uri    = aws_lambda_function.saveCredentials.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
}

resource "aws_apigatewayv2_authorizer" "authorizer" {
  api_id           = aws_apigatewayv2_api.lambda.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "ecommerce-authorizer"

  jwt_configuration {
    audience = ["34i1j18acnv0hqqsiarlfnjj6k"]
    issuer   = "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Bi6FQeFqv"
  }
}

resource "aws_apigatewayv2_route" "hello_world" {
  api_id = aws_apigatewayv2_api.lambda.id

  route_key          = "POST /credentials"
  target             = "integrations/${aws_apigatewayv2_integration.hello_world.id}"
  authorizer_id      = aws_apigatewayv2_authorizer.customAuthorizer.id
  authorization_type = "CUSTOM"
}

resource "aws_cloudwatch_log_group" "api_gw" {
  name = "/aws/api_gw/${aws_apigatewayv2_api.lambda.name}"

  retention_in_days = 30
}

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.saveCredentials.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.lambda.execution_arn}/*/*"
}

# ############ DYNAMODB ############
resource "aws_dynamodb_table" "basic-dynamodb-table" {
  name         = "${terraform.workspace}Credentials"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "UserId"
  range_key    = "Provider"

  attribute {
    name = "UserId"
    type = "S"
  }

  attribute {
    name = "Provider"
    type = "S"
  }

  tags = {
    Name        = "dynamodb-credentials-table"
    Environment = terraform.workspace
  }
}
