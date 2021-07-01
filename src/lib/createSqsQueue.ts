import { SQS } from 'aws-sdk'
import { SqsClient } from './SqsClient'
import { SqsQueue } from './SqsQueue'

export async function createSqsQueue({
  client,
  name,
}: {
  client: SqsClient
  name: string
}): Promise<SqsQueue> {
  const url = await getQueueUrl({ client, name })
  const attributes = await getQueueAttributes({ client, url })
  return new SqsQueue({ client, name, url, attributes })
}

async function getQueueUrl({ client, name }: { client: SqsClient; name: string }): Promise<string> {
  const result = await client
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

async function getQueueAttributes({
  client,
  url,
}: {
  client: SqsClient
  url: string
}): Promise<SQS.QueueAttributeMap> {
  const result = await client
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
