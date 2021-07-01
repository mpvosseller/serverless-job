import { SQS } from 'aws-sdk'
import { Queue, ReceiveMessageRequestOptions, SendMessageRequestWithoutQueueUrl } from './Queue'
import { SqsClient } from './SqsClient'

export class SqsQueue implements Queue {
  private client: SqsClient
  private name: string
  private url: string
  private attributes: SQS.QueueAttributeMap
  private redrivePolicy: Record<string, unknown>

  constructor({
    client,
    name,
    url,
    attributes,
  }: {
    client: SqsClient
    name: string
    url: string
    attributes: SQS.QueueAttributeMap
  }) {
    this.client = client
    this.name = name
    this.url = url
    this.attributes = attributes
    this.redrivePolicy = JSON.parse(this.attributes.RedrivePolicy) as Record<string, unknown>
  }

  getName(): string {
    return this.name
  }

  getUrl(): string {
    return this.url
  }

  getAttributes(): SQS.QueueAttributeMap {
    return this.attributes
  }

  getArn(): string {
    return this.attributes.QueueArn
  }

  isFifo(): boolean {
    return this.name.endsWith('.fifo')
  }

  getMaxReceiveCount(): number {
    return parseInt(this.redrivePolicy.maxReceiveCount as string)
  }

  async sendMessage(message: SendMessageRequestWithoutQueueUrl): Promise<void> {
    const request = {
      QueueUrl: this.getUrl(),
      ...message,
    }
    await this.client.getSqs().sendMessage(request).promise()
  }

  async deleteMessage(receiptHandle: string): Promise<void> {
    const request = {
      QueueUrl: this.getUrl(),
      ReceiptHandle: receiptHandle,
    }
    await this.client.getSqs().deleteMessage(request).promise()
  }

  async changeMessageVisibility({
    receiptHandle,
    visibilityTimeout,
  }: {
    receiptHandle: string
    visibilityTimeout: number
  }): Promise<void> {
    const request = {
      QueueUrl: this.getUrl(),
      ReceiptHandle: receiptHandle,
      VisibilityTimeout: visibilityTimeout,
    }
    await this.client.getSqs().changeMessageVisibility(request).promise()
  }

  async receiveMessage(options?: ReceiveMessageRequestOptions): Promise<SQS.ReceiveMessageResult> {
    const request = {
      QueueUrl: this.getUrl(),
      AttributeNames: ['All'],
      MessageAttributeNames: ['All'],
      MaxNumberOfMessages: 1,
      ...options,
    }
    return await this.client.getSqs().receiveMessage(request).promise()
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  async purgeQueue(): Promise<{}> {
    const request = {
      QueueUrl: this.getUrl(),
    }
    return await this.client.getSqs().purgeQueue(request).promise()
  }
}
