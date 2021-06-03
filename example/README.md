# Example serverless-job project using the CDK

This project demonstrates using the `serverless-job` package to run background jobs with AWS Lambda and Amazon SQS.

It exposes an HTTP endpoint (`/crawl?url=${URL}`) that kicks off a backround job to fetch the given URL.

http post ${API_GATEWAY_URL}/crawl?url=https://www.google.com

## Useful commands
 * `yarn install`    install dependencies
 * `yarn upgrade serverless-job` install (copy) the latest serverless-job package from the parent directory
 * `yarn clean`      clean the project
 * `yarn build`      build the project
 * `yarn cdk deploy` deploy the project
 