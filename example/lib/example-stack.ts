import * as apigateway from '@aws-cdk/aws-apigatewayv2'
import * as apigatewayIntegrations from '@aws-cdk/aws-apigatewayv2-integrations'
import * as iam from '@aws-cdk/aws-iam'
import * as lambda from '@aws-cdk/aws-lambda'
import * as lambdaEventSources from '@aws-cdk/aws-lambda-event-sources'
import * as sqs from '@aws-cdk/aws-sqs'
import * as cdk from '@aws-cdk/core'
import { CfnOutput, Duration } from '@aws-cdk/core'

export class ExampleStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const jobDeadletterQueue = new sqs.Queue(this, 'JobDeadLetterQueue', {
      retentionPeriod: Duration.days(14),
    })

    const lambdaTimeoutDuration = Duration.minutes(15)

    const jobQueue = new sqs.Queue(this, 'JobQueue', {
      visibilityTimeout: lambdaTimeoutDuration.plus(Duration.seconds(1)), // should be greater than the lambda function's timeout
      receiveMessageWaitTime: Duration.seconds(10),
      deadLetterQueue: {
        queue: jobDeadletterQueue,
        maxReceiveCount: 13, // should be less than your global maxReceiveCount or nothing will ever be sent to it
      },
    })

    const lambdaFn = new lambda.Function(this, 'ServerlessJobExampleFunction', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      timeout: lambdaTimeoutDuration,
      code: lambda.Code.fromAsset('./build/dist.zip'),
      environment: {
        JOB_QUEUE_NAME: jobQueue.queueName,
      },
      initialPolicy: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'sqs:SendMessage',
            'sqs:ReceiveMessage',
            'sqs:DeleteMessage',
            'sqs:ChangeMessageVisibility',
            'sqs:GetQueueUrl',
            'sqs:GetQueueAttributes',
          ],
          resources: [jobQueue.queueArn],
        }),
      ],
    })
    lambdaFn.addEventSource(
      new lambdaEventSources.SqsEventSource(jobQueue, {
        batchSize: 1,
      })
    )

    const httpApi = new apigateway.HttpApi(this, 'HttpApi', {
      apiName: 'serverless-job-example',
      defaultIntegration: new apigatewayIntegrations.LambdaProxyIntegration({
        handler: lambdaFn,
      }),
    })

    new CfnOutput(this, 'ApiGatewayEndpoint', {
      value: httpApi.apiEndpoint,
    })
  }
}
