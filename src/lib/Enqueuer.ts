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
    await queue.sendMessage(message)
  }
}
