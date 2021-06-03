const awsSdk = jest.genMockFromModule<typeof import('aws-sdk')>('aws-sdk')

awsSdk.SQS.prototype.sendMessage = jest.fn()
awsSdk.SQS.prototype.deleteMessage = jest.fn()
awsSdk.SQS.prototype.receiveMessage = jest.fn()
awsSdk.SQS.prototype.changeMessageVisibility = jest.fn()
awsSdk.SQS.prototype.getQueueUrl = jest.fn()
awsSdk.SQS.prototype.getQueueAttributes = jest.fn()

export = awsSdk
