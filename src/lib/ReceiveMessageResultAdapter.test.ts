import { SQS } from 'aws-sdk'
import { ReceiveMessageResultAdapter } from './ReceiveMessageResultAdapter'

test('returns an SQSEvent wrapper around the given ReceiveMessageResult and its Messages', () => {
  const receiveMessageResult = {
    Messages: [
      {
        MessageId: 'someMessageId1',
      },
      {
        MessageId: 'someMessageId2',
      },
    ],
  } as SQS.ReceiveMessageResult
  const arn = 'someArn'

  const result = ReceiveMessageResultAdapter.createSqsEvent(receiveMessageResult, arn)

  expect(result).toBeTruthy()
  if (!result) throw new Error()
  expect(result.Records.length).toBe(2)
  expect(result.Records[0].messageId).toBe('someMessageId1')
  expect(result.Records[1].messageId).toBe('someMessageId2')
  expect(result.Records[0].eventSourceARN).toBe('someArn')
})

test('returns undefined when Messages is undefined', () => {
  const receiveMessageResult = {
    Messages: undefined,
  } as SQS.ReceiveMessageResult
  const arn = 'someArn'

  const result = ReceiveMessageResultAdapter.createSqsEvent(receiveMessageResult, arn)

  expect(result).toBeUndefined()
})

test('returns undefined when Messages is an empty array', () => {
  const receiveMessageResult = {
    Messages: [],
  } as SQS.ReceiveMessageResult
  const arn = 'someArn'

  const result = ReceiveMessageResultAdapter.createSqsEvent(receiveMessageResult, arn)

  expect(result).toBeUndefined()
})
