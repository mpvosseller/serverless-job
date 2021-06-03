import { DeferredJob } from './DeferredJob'
import { MessageBuilder } from './MessageBuilder'
import { getSqsClient } from './SqsClient'

export class Enqueuer {
  static async enqueue({ job, args }: { job: DeferredJob; args: unknown[] }): Promise<void> {
    const queue = await getSqsClient().getQueue(job.options.queueName)
    const message = new MessageBuilder({
      job,
      args,
      isFifo: queue.isFifo(),
    }).build()
    await queue.sendMessage(message)
  }
}
