import { CloudWatchMetricLogger } from './CloudWatchMetricLogger'
import { DeferredJob } from './DeferredJob'
import { MessageBuilder } from './MessageBuilder'
import { getQueueClient } from './Queue'

export class Enqueuer {
  static async enqueue({ job, args }: { job: DeferredJob; args: unknown[] }): Promise<void> {
    const queue = await getQueueClient().getQueue(job.options.queueName)
    const message = new MessageBuilder({
      job,
      args,
      isFifo: queue.isFifo(),
    }).build()
    const sendMessageResult = await queue.sendMessage(message)
    CloudWatchMetricLogger.logEvent({
      name: 'enqueue',
      deferredJob: job,
      args,
      queue,
      sendMessageResult,
    })
  }
}
