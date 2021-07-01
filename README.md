# serverless-job

A framework for declaring and running "jobs" on AWS Lambda using Amazon SQS as
the queuing backend. It's like Active Job for Lambda.

I expect this library to be most useful to those running something like Express,
Koa, or Hapi on Lambda with a package like
[serverless-http](https://github.com/dougmoscrop/serverless-http) (AKA "monolithic functions").

## Features

- Simple API for declaring and enqueing jobs
- Backed by Amazon SQS
- Supports multiple queues
- Supports FIFO queues
- By default each job is attempted at most 13 times with an exponential backoff after each failure
- Each job type can customize the maximum attempts and backoff algorithm
- Jobs can be enqueued with a short delay (up to 15 minutes) before they are added to the queue
- Supports dead-letter queues
- Local development is supported with a built-in event poller

## Example API Usage with TypeScript

```typescript
// MyJob.ts
import { BaseJob, Job } from 'serverless-job'

@Job() // define a Job by extending BaseJob and using the @Job decorator
export class MyJob extends BaseJob {
  // implement job logic in an async perform() method. It may take any number of arguments but each must be serializable to JSON
  async perform(arg1: string, arg2: number): Promise<void> {
    // ...
  }

  // optionally implement a static maxAttempts() method to define maximum attempts of this job
  static maxAttempts(): number {
    return 3
  }

  // optionally implement a static getBackoff() method to define the wait time between attempt n and attempt n+1
  static getBackoff(attempt: number): number {
    return 300 // 5 minutes
  }
}
```

```typescript
// index.ts
import { Context } from 'aws-lambda'
import { ServerlessJob } from 'serverless-job'

ServerlessJob.configure({
  defaultQueueName: process.env.JOB_QUEUE_NAME, // name of the default queue
  jobs: 'jobs/**/*.js', // path pattern to your job modules
  maxAttempts: 13, // max attempts per job
  sqs: {
    // any aws sqs configuration you may need
    region: 'us-east-1',
  },
})

// lambda handler
export async function handler(event: any, context: Context): Promise<unknown> {
  if (ServerlessJob.isJobEvent(event)) {
    return ServerlessJob.handleEvent(event) // handles all job events
  } else {
    // handle all other lambda events
    // if using serverless-http call it's handler here
  }
}

// example function that kicks of background jobs
async function startBackgroundJobs() {
  // adds a background job to the default queue
  await MyJob.performLater('someArg1', 1)

  // adds a background job to a secondary queue with a 5 minute delay before it can run
  await MyJob.set({
    queueName: 'someOtherQueueName',
    delaySeconds: 300,
  }).performLater('someArg2', 2)

  // add a background job to a FIFO queue with a deduplicationId and groupId
  await MyJob.set({
    queueName: 'someQueue.fifo',
    deduplicationId: 'someDeduplicationId',
    groupId: 'someGroupId',
  }).performLater('someArg3', 3)
}
```

## AWS Setup

To use `serverless-job` in production you will need to configure at least one AWS
Lambda function and at least one Amazon SQS queue in your AWS environment.

There are many ways you can setup your AWS environment:

- Manually in the [AWS Management Console](https://aws.amazon.com/console)
- [AWS CloudFormation](https://aws.amazon.com/cloudformation)
- [AWS SAM](https://aws.amazon.com/serverless/sam)
- [The Serverless Framework](https://www.serverless.com)
- [AWS CDK](https://aws.amazon.com/cdk)

However you set up your environment the most important considerations are:

- The `timeout` of your Lambda function must be long enough to process one job
- The `visibilityTimeout` of your queues should be greater than the Lambda function's timeout
- You must provide the name of your default queue to your Lambda function. Usually this is done with an environment variable like `JOB_QUEUE_NAME`
- You must grant the Lambda functions permission to use the queues
- You must configure your queues as event sources for your Lambda with a `batchSize` = 1

NOTE: Depending on your needs you may want to configure multiple Lambda functions.
For example, it is common to configure one Lambda function for handling HTTP user
events and another for handling the jobs. This allows you to set a much shorter
timeout period for the former.

Below is a sample configuration (with a single Lambda function) using the AWS CDK.

### AWS CDK

```typescript
const lambdaTimeoutDuration = Duration.minutes(15)

const jobQueue = new sqs.Queue(this, 'JobQueue', {
  visibilityTimeout: lambdaTimeoutDuration.plus(Duration.seconds(1)), // should be greater than the lambda function's timeout
  receiveMessageWaitTime: Duration.seconds(10),
})

const lambdaFn = new lambda.Function(this, 'Function', {
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
```

## SQS Message Retention Period

Each SQS Queue has a `MessageRetentionPeriod` associated with it. The default
value is 4 days but it can be configured between 1 minute and 14 days.

If a job remains in the queue for longer than the `MessageRetentionPeriod` it
will be deleted. It will be deleted even if the Job's `maxAttempts` has not
yet been reached.

## SQS Dead-letter Queues

You may optionally configure your SQS Queue to use a [dead-letter queue](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html).

Once configured any Job on the respective queue will be forwarded to the
dead-letter queue after it has been attempted `maxReceiveCount` (of the
redrive policy) times.

Note that `maxReceiveCount` (of the redrive policy) supersedes `maxAttempts`
(of the Job). This means that:

- when `maxReceiveCount` < `maxAttempts` - a failed job will be sent to the dead-letter queue and will only be attempted `maxReceiveCount` times
- when `maxReceiveCount` >= `maxAttempts` - a failed job will be deleted after `maxAttempts` and will not be sent to the dead-letter queue

Sending failed jobs to the dead-letter queue when `maxReceiveCount` >= `maxAttempts` is not supported.

## Local Development

`serverless-job` supports developing and running your application locally.

When developing locally you do not need to configure a Lambda function. You do
still need to configure one or more SQS Queues and will need a network connection.
Offline development is not supported.

The main difference when running locally is that we can't depend on the direct
Lambda/SQS integration for event delivery. Instead when running locally you must
poll for events from each queue. You can do this by creating a `Poller` object for
each SQS Queue you are using.

```typescript
// begin polling the default queue. Each event is sent directly to ServerlessJob.handleEvent(event)
new Poller({
  purgeOnStart: true, // optional: delete all events in the queue before polling starts. This can be useful in development to start with a clean slate
})

// begin polling a secondary queue
new Poller({
  queueName: 'otherQueue',
})

// begin polling on the default queue with a custom handler
new Poller({
  handler: (event: SQSEvent) => myCustomHandler(event), // events are sent to myCustomHandler(event) instead of ServerlessJob.handleEvent(event)
})
```

NOTE: Be sure to create and use distinct queues for local development. If your
local application uses the same queue as a deployed Lambda you can not be certain
which one will process an event published by either.

## Acknowledgements

This project was inspired directly by the Ruby on Rails [Active Job API](https://guides.rubyonrails.org/active_job_basics.html)
and the [Lambdakiq](https://github.com/customink/lambdakiq) project.

Special thanks to [Ken Collins](https://github.com/metaskills), the primary developer of the [Lambdakiq](https://github.com/customink/lambdakiq)
project. Most of what I know about SQS was learned by reading his
code and this project is largely just a port of that project to Node.js.
