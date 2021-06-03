import { SQS } from 'aws-sdk'
import { ReceiveMessageRequest } from 'aws-sdk/clients/sqs'
import { getSqsClient } from './SqsClient'

export type SendMessageRequestWithoutQueueUrl = Omit<SQS.Types.SendMessageRequest, 'QueueUrl'>
export type ReceiveMessageRequestOptions = Omit<
  ReceiveMessageRequest,
  'QueueUrl' | 'AttributeNames' | 'MessageAttributeNames'
>

export class SqsQueue {
  private name: string
  private url: string
  private attributes: SQS.QueueAttributeMap
  private redrivePolicy: Record<string, unknown>

  constructor({
    name,
    url,
    attributes,
  }: {
    name: string
    url: string
    attributes: SQS.QueueAttributeMap
  }) {
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
    await getSqsClient().getSqs().sendMessage(request).promise()
  }

  async deleteMessage(receiptHandle: string): Promise<void> {
    const request = {
      QueueUrl: this.getUrl(),
      ReceiptHandle: receiptHandle,
    }
    await getSqsClient().getSqs().deleteMessage(request).promise()
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
    await getSqsClient().getSqs().changeMessageVisibility(request).promise()
  }

  async receiveMessage(options?: ReceiveMessageRequestOptions): Promise<SQS.ReceiveMessageResult> {
    const request = {
      QueueUrl: this.getUrl(),
      AttributeNames: ['All'],
      MessageAttributeNames: ['All'],
      MaxNumberOfMessages: 1,
      ...options,
    }
    return await getSqsClient().getSqs().receiveMessage(request).promise()
  }
}
