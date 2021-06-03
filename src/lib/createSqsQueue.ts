import { SQS } from 'aws-sdk'
import { getSqsClient } from './SqsClient'
import { SqsQueue } from './SqsQueue'

export async function createSqsQueue(name: string): Promise<SqsQueue> {
  const url = await getQueueUrl(name)
  const attributes = await getQueueAttributes(url)
  return new SqsQueue({ name, url, attributes })
}

async function getQueueUrl(name: string): Promise<string> {
  const result = await getSqsClient()
    .getSqs()
    .getQueueUrl({
      QueueName: name,
    })
    .promise()
  const url = result.QueueUrl
  if (!url) {
    throw new Error('failed to get queue url')
  }
  return url
}

async function getQueueAttributes(url: string): Promise<SQS.QueueAttributeMap> {
  const result = await getSqsClient()
    .getSqs()
    .getQueueAttributes({
      QueueUrl: url,
      AttributeNames: ['All'],
    })
    .promise()
  const attributes = result.Attributes
  if (!attributes) {
    throw new Error('failed to get queue attributes')
  }
  return attributes
}
