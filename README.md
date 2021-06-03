# serverless-job

A framework for declaring and running "jobs" on AWS Lambda using Amazon SQS. It's like Active Job for Node.js on Lambda.

This may be especially useful to those running something like Express, Koa, or Hapi on Lambda with a package like
[serverless-http](https://github.com/dougmoscrop/serverless-http) (AKA "monolithic functions"). By using the `serverless-job`
package your http user event handlers can easily kick off background jobs to be performed later.

This project was inspired directly by the Ruby on Rails [Active Job API](https://guides.rubyonrails.org/active_job_basics.html)
and the [Lambdakiq](https://github.com/customink/lambdakiq) project.

## Features

- Simple API for declaring and enqueing jobs
- Supports multiple queues and FIFO queues
- By default each job is attempted at most 13 times with an exponential backoff after each failure
- Each job type can customize the maxAttempts and backoff algorithm
- Jobs can be enqueued with a short delay before they will run (up to 15 minutes)

## Basic API

```typescript
// MyJob.ts
import { BaseJob, Job } from 'serverless-job'

@Job() // use the @Job() decorator and extend BaseJob
export class MyJob extends BaseJob {
  // implement job logic in an async perform() method. can take any arguments but must all be serializable to JSON
  async perform(arg1: string, arg2: number): Promise<void> {
    // job logic
  }

  // optionally override maxAttempts for this job type. default is 13
  static maxAttempts(): number {
    return 3
  }

  // optionally override the time to wait between attempt and attempt+1. Default is an exponenial backoff.
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
  sqs: { // aws sqs configuration
     region: 'us-east-1'
  }
})

export async function handler(event: any, context: Context): Promise<unknown> {
  if (ServerlessJob.isJobEvent(event)) {
    // handle background jobs
    return ServerlessJob.handleEvent(event)
  }
  // handle other lambda requests
  if (...) {
      // add a background job to the default queue
      await MyJob.performLater('someStr', 42)

      // add a background job to a secondary queue with a 5 minute delay before it can run
      await MyJob.set({
        queueName: 'someOtherQueueName',
        delaySeconds: 300,
      }).performLater()

      // add a background job to a FIFO queue
      await MyJob.set({
        queueName: 'someQueue.fifo',
        deduplicationId: 'someDeduplicationId',
        groupId: 'someGroupId',
      }).performLater()
  }
}
```

## Setup

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
