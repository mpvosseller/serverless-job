import { SQS } from 'aws-sdk'
import { DeferredJob } from './DeferredJob'
import { JobSerializer } from './JobSerializer'
import { SendMessageRequestWithoutQueueUrl } from './Queue'
import { SerializableJob } from './SerializableJob'

export const ServerlessJobAttributeName = 'serverless-job'
export const ServerlessJobAttributeValue = '1'

type PartialSendMessageRequest = Partial<SQS.Types.SendMessageRequest>

export class MessageBuilder {
  private job: DeferredJob
  private args: unknown[]
  private isFifo: boolean

  constructor({
    job,
    args,
    isFifo = false,
  }: {
    job: DeferredJob
    args: unknown[]
    isFifo?: boolean
  }) {
    this.job = job
    this.args = args
    this.isFifo = isFifo
  }

  build(): SendMessageRequestWithoutQueueUrl {
    return {
      MessageBody: this.getMessageBody(),
      MessageAttributes: this.getMessageAttributes(),
      ...this.getMessageOptions(),
    }
  }

  private getMessageBody(): string {
    const job = new SerializableJob(this.job.clazz, this.args)
    return JobSerializer.serialize(job)
  }

  private getMessageAttributes(): SQS.Types.MessageBodyAttributeMap {
    return {
      [ServerlessJobAttributeName]: {
        StringValue: ServerlessJobAttributeValue,
        DataType: 'String',
      },
    }
  }

  private getMessageOptions(): PartialSendMessageRequest {
    if (this.isFifo) {
      return this.getFifoOptions()
    } else {
      return this.getStandardOptions()
    }
  }

  private getFifoOptions(): PartialSendMessageRequest {
    return {
      MessageGroupId: this.job.options.groupId,
      MessageDeduplicationId: this.job.options.deduplicationId,
    }
  }

  private getStandardOptions(): PartialSendMessageRequest {
    // delay should be positive with a max delay of 900 (15 mins) https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_SendMessage.html
    const delay = Math.max(0, Math.min(this.job.options.delaySeconds || 0, 900))
    return {
      DelaySeconds: delay || undefined,
    }
  }
}
