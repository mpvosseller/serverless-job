import { SQS } from 'aws-sdk'
import { serializeError } from 'serialize-error'
import { DeferredJob } from './DeferredJob'
import { JobRecord } from './JobRecord'
import { Queue } from './Queue'
import { Registry } from './Registry'
import { SerializableJob } from './SerializableJob'
import { ServerlessJob } from './ServerlessJob'

export interface Logger {
  log(message?: unknown, ...optionalParams: unknown[]): void
}

interface Event {
  name: 'enqueue' | 'perform_start' | 'perform' | 'enqueue_retry' | 'retry_stopped'

  // enqueue
  deferredJob?: DeferredJob
  args?: unknown[]
  queue?: Queue
  sendMessageResult?: SQS.SendMessageResult

  // perform_start, perform, enqueue_retry, retry_stopped
  job?: SerializableJob
  jobRecord?: JobRecord

  // perform, enqueue_retry, retry_stopped
  error?: Error

  // enqueue_retry
  nextVisibilityTimeout?: number // seconds

  // perform
  duration?: number // milliseconds
}

// https://github.com/customink/lambdakiq/blob/main/lib/lambdakiq/metrics.rb
// https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format_Specification.html
// https://guides.rubyonrails.org/active_support_instrumentation.html#enqueue-at-active-job
export class CloudWatchMetricLogger {
  static logEvent(event: Event): void {
    const clazz = event.deferredJob?.clazz || event.job?.clazz
    const jobName = clazz ? Registry.getName(clazz) : undefined
    const messageId = event.sendMessageResult?.MessageId || event.jobRecord?.messageId
    const queueName = event?.queue?.getName() || event.jobRecord?.queueName
    const jobArgs = event.args || event.job?.args

    const logger = ServerlessJob.getConfig().metricsLogger

    logger.log(
      JSON.stringify({
        _aws: {
          Timestamp: new Date().getTime(),
          CloudWatchMetrics: [
            {
              Namespace: ServerlessJob.getConfig().metricsNameSpace,
              Dimensions: [['AppName', 'JobEvent', 'JobName']],
              Metrics: [
                {
                  Name: 'Duration',
                  Unit: 'Milliseconds',
                },
                {
                  Name: 'Count',
                  Unit: 'Count',
                },
                {
                  Name: 'ErrorCount',
                  Unit: 'Count',
                },
              ],
            },
          ],
        },
        //
        // Dimensions
        //
        AppName: ServerlessJob.getConfig().metricsAppName,
        JobEvent: event.name,
        JobName: jobName,
        //
        // Metrics
        //
        Duration: event.duration,
        Count: 1,
        ErrorCount: event.error ? 1 : 0,
        //
        // Additional Properties
        //
        QueueName: queueName,
        MessageId: messageId,
        ErrorType: event.error?.constructor.name,
        Error: serializeError(event.error),
        EnqueuedAt: event.jobRecord?.sentAt,
        Executions: event.jobRecord?.receiveCount,
        JobArgs: jobArgs,
        NextVisibilityTimeout: event.nextVisibilityTimeout,
      })
    )
  }
}
