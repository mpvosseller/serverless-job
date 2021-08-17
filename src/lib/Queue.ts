import { SQS } from 'aws-sdk'
import { ReceiveMessageRequest } from 'aws-sdk/clients/sqs'
import { SqsClient } from './SqsClient'

export type SendMessageRequestWithoutQueueUrl = Omit<SQS.Types.SendMessageRequest, 'QueueUrl'>
export type ReceiveMessageRequestOptions = Omit<
  ReceiveMessageRequest,
  'QueueUrl' | 'AttributeNames' | 'MessageAttributeNames'
>

export interface Queue {
  getName(): string
  getArn(): string
  isFifo(): boolean
  sendMessage(message: SendMessageRequestWithoutQueueUrl): Promise<SQS.SendMessageResult>
  deleteMessage(receiptHandle: string): Promise<void>
  changeMessageVisibility({
    receiptHandle,
    visibilityTimeout,
  }: {
    receiptHandle: string
    visibilityTimeout: number
  }): Promise<void>
  receiveMessage(options?: ReceiveMessageRequestOptions): Promise<SQS.ReceiveMessageResult>
  // eslint-disable-next-line @typescript-eslint/ban-types
  purgeQueue(): Promise<{}>
}

export interface QueueClient {
  getQueue(name?: string): Promise<Queue>
}

let instance: QueueClient | undefined = undefined

export function getQueueClient(): QueueClient {
  if (!instance) {
    instance = new SqsClient()
  }
  return instance
}
