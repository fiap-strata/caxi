terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 6.0" }
  }
}
provider "aws" { region = var.region }
variable "region" { default = "sa-east-1" }
variable "meta_secret_arn" { type = string }
variable "meta_template_name" { type = string }
variable "meta_graph_version" { type = string }
variable "sender_zip" { default = "sender.zip" }
data "aws_caller_identity" "current" {}
resource "aws_kms_key" "otp" {
  description = "Caxi Cognito authentication codes"
  enable_key_rotation = true
  deletion_window_in_days = 30
}
resource "aws_iam_role" "sender" {
  name_prefix = "caxi-otp-"
  assume_role_policy = jsonencode({Version="2012-10-17",Statement=[{Effect="Allow",Principal={Service="lambda.amazonaws.com"},Action="sts:AssumeRole"}]})
}
resource "aws_iam_role_policy" "sender" {
  role = aws_iam_role.sender.id
  policy = jsonencode({Version="2012-10-17",Statement=[
    {Effect="Allow",Action=["kms:Decrypt"],Resource=aws_kms_key.otp.arn},
    {Effect="Allow",Action=["secretsmanager:GetSecretValue"],Resource=var.meta_secret_arn},
    {Effect="Allow",Action=["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"],Resource="arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:*"}
  ]})
}
resource "aws_lambda_function" "sender" {
  function_name = "caxi-whatsapp-auth"
  role = aws_iam_role.sender.arn
  handler = "index.handler"
  runtime = "nodejs22.x"
  timeout = 20
  filename = var.sender_zip
  source_code_hash = filebase64sha256(var.sender_zip)
  environment {
    variables = {
      KMS_KEY_ARN = aws_kms_key.otp.arn
      META_SECRET_ARN = var.meta_secret_arn
      META_TEMPLATE_NAME = var.meta_template_name
      META_GRAPH_VERSION = var.meta_graph_version
    }
  }
}
resource "aws_cognito_user_pool" "caxi" {
  name = "caxi-vendors"
  user_pool_tier = "ESSENTIALS"
  username_attributes = ["phone_number"]
  deletion_protection = "ACTIVE"
  admin_create_user_config { allow_admin_create_user_only = true }
  sign_in_policy { allowed_first_auth_factors = ["SMS_OTP"] }
  lambda_config {
    kms_key_id = aws_kms_key.otp.arn
    custom_sms_sender {
      lambda_arn = aws_lambda_function.sender.arn
      lambda_version = "V1_0"
    }
  }
}
resource "aws_lambda_permission" "cognito" {
  action = "lambda:InvokeFunction"
  function_name = aws_lambda_function.sender.function_name
  principal = "cognito-idp.amazonaws.com"
  source_arn = aws_cognito_user_pool.caxi.arn
}
resource "aws_cognito_user_pool_client" "web" {
  name = "caxi-api"
  user_pool_id = aws_cognito_user_pool.caxi.id
  generate_secret = false
  explicit_auth_flows = ["ALLOW_USER_AUTH","ALLOW_REFRESH_TOKEN_AUTH"]
  prevent_user_existence_errors = "ENABLED"
  access_token_validity = 1
  id_token_validity = 1
  refresh_token_validity = 7
}
output "user_pool_id" { value = aws_cognito_user_pool.caxi.id }
output "client_id" { value = aws_cognito_user_pool_client.web.id }
