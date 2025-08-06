#!/bin/bash

# Deploy Lambda functions for vaccine recommendation API
# This is a simple alternative to Amplify Gen 2 backend

set -e

echo "🚀 Deploying Vaccine Recommendation Lambda Functions"

# Configuration
REGION="us-east-1"
FUNCTION_NAME_PARSER="vaccine-parser"
FUNCTION_NAME_CATCHUP="vaccine-catchup" 
ROLE_NAME="VaccineLambdaExecutionRole"
OPENAI_API_KEY="${OPENAI_API_KEY:-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}"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &>/dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Create IAM role for Lambda if it doesn't exist
echo "📋 Creating IAM role for Lambda functions..."
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text 2>/dev/null || {
    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document '{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }' \
        --query 'Role.Arn' --output text
    
    # Attach basic Lambda execution policy
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
    
    echo "⏳ Waiting for IAM role to be ready..."
    sleep 10
})

echo "✅ IAM Role ARN: $ROLE_ARN"

# Create deployment package
echo "📦 Creating deployment package..."
mkdir -p lambda-dist
cp -r server/ lambda-dist/
cp -r shared/ lambda-dist/
cp package.json lambda-dist/
cd lambda-dist

# Install dependencies for Lambda
echo "📥 Installing dependencies..."
npm ci --production

# Create the handler file
cat > index.js << 'EOF'
// Lambda handler for vaccine API
const { VaccineParserService } = require('./server/services/vaccine-parser');
const { VaccineCatchUpService } = require('./server/services/vaccine-catchup');

const vaccineParser = new VaccineParserService();
const vaccineCatchUp = new VaccineCatchUpService();

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    const { path, httpMethod: method, body } = event;
    let requestBody;
    
    try {
        requestBody = body ? JSON.parse(body) : {};
    } catch (e) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Invalid JSON body' }),
        };
    }
    
    try {
        if (path === '/api/parse-vaccine-history' && method === 'POST') {
            const result = await vaccineParser.parseVaccineHistory(
                requestBody.vaccineData, 
                requestBody.birthDate
            );
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result),
            };
        } else if (path === '/api/vaccine-catchup' && method === 'POST') {
            const result = await vaccineCatchUp.generateCatchUpRecommendations(requestBody);
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result),
            };
        } else {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Not Found' }),
            };
        }
    } catch (error) {
        console.error('API Error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: error.message || 'Internal Server Error' }),
        };
    }
};
EOF

# Create ZIP package
echo "🗜️ Creating ZIP package..."
zip -r ../vaccine-api.zip . -x "*.git*" "node_modules/.cache/*"

cd ..

# Deploy Lambda function
echo "☁️ Deploying Lambda function..."
aws lambda create-function \
    --function-name $FUNCTION_NAME_PARSER \
    --runtime nodejs20.x \
    --role $ROLE_ARN \
    --handler index.handler \
    --zip-file fileb://vaccine-api.zip \
    --timeout 60 \
    --memory-size 1024 \
    --environment Variables="{OPENAI_API_KEY=$OPENAI_API_KEY}" \
    --region $REGION 2>/dev/null || {
    
    echo "📝 Function exists, updating..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME_PARSER \
        --zip-file fileb://vaccine-api.zip \
        --region $REGION
    
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME_PARSER \
        --environment Variables="{OPENAI_API_KEY=$OPENAI_API_KEY}" \
        --region $REGION
}

# Create API Gateway to expose the function
echo "🌐 Creating API Gateway..."
API_ID=$(aws apigatewayv2 create-api \
    --name vaccine-api \
    --protocol-type HTTP \
    --cors-configuration AllowMethods="*",AllowOrigins="*",AllowHeaders="*" \
    --region $REGION \
    --query 'ApiId' --output text 2>/dev/null || {
    aws apigatewayv2 get-apis --region $REGION --query 'Items[?Name==`vaccine-api`].ApiId' --output text | head -1
})

echo "✅ API Gateway ID: $API_ID"

# Get Lambda function ARN
FUNCTION_ARN=$(aws lambda get-function \
    --function-name $FUNCTION_NAME_PARSER \
    --region $REGION \
    --query 'Configuration.FunctionArn' --output text)

# Create integration
INTEGRATION_ID=$(aws apigatewayv2 create-integration \
    --api-id $API_ID \
    --integration-type AWS_PROXY \
    --integration-uri $FUNCTION_ARN \
    --payload-format-version 2.0 \
    --region $REGION \
    --query 'IntegrationId' --output text 2>/dev/null || {
    aws apigatewayv2 get-integrations --api-id $API_ID --region $REGION --query 'Items[0].IntegrationId' --output text
})

# Create routes
aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "POST /api/parse-vaccine-history" \
    --target integrations/$INTEGRATION_ID \
    --region $REGION 2>/dev/null || echo "Route already exists"

aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "POST /api/vaccine-catchup" \
    --target integrations/$INTEGRATION_ID \
    --region $REGION 2>/dev/null || echo "Route already exists"

# Give API Gateway permission to invoke Lambda
aws lambda add-permission \
    --function-name $FUNCTION_NAME_PARSER \
    --statement-id apigateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:*:$API_ID/*/*" \
    --region $REGION 2>/dev/null || echo "Permission already exists"

# Get API endpoint
API_ENDPOINT=$(aws apigatewayv2 get-api \
    --api-id $API_ID \
    --region $REGION \
    --query 'ApiEndpoint' --output text)

echo ""
echo "🎉 Deployment Complete!"
echo "📡 API Endpoint: $API_ENDPOINT"
echo ""
echo "Test the API:"
echo "curl -X POST $API_ENDPOINT/api/parse-vaccine-history -H 'Content-Type: application/json' -d '{\"vaccineData\":\"test\"}'"
echo ""

# Clean up
rm -rf lambda-dist vaccine-api.zip

echo "✨ Lambda functions deployed successfully!"