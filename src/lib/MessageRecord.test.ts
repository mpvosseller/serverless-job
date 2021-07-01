import { SQS } from 'aws-sdk'
import { MessageRecord } from './MessageRecord'

test('awsRegion() returns the region based on the given arn', () => {
  const message = {} as SQS.Message
  const messageRecord = new MessageRecord(message, 'arn:aws:sqs:us-west-2:123456789:myQueueName')
  const result = messageRecord.awsRegion
  expect(result).toBe('us-west-2')
})

test('body() returns the body', () => {
  const message = { Body: 'myBody' } as SQS.Message
  const messageRecord = new MessageRecord(message, 'myArn')
  const result = messageRecord.body
  expect(result).toBe('myBody')
})

test('properties of each messageAttribute are camalCased', () => {
  const message = {
    MessageAttributes: {
      someAttribute: {
        StringValue: 'someStringValue', // uppercase S in StringValue
        BinaryValue: 'someBinaryValue', // uppercase B in BinaryValue
        DataType: 'String', // uppercase D in DataType
      },
    },
  } as SQS.Message

  const messageRecord = new MessageRecord(message, 'myArn')
  const attribute = messageRecord.messageAttributes.someAttribute
  expect(attribute.stringValue).toBe('someStringValue') // lowecrase s in stringValue
  expect(attribute.binaryValue).toBe('someBinaryValue') // lowercase b in binaryValue
  expect(attribute.dataType).toBe('String') // lowercase d in dataType
})
