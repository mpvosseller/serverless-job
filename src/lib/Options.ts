export interface Options {
  queueName?: string
  delaySeconds?: number // standard queues only
  deduplicationId?: string // FIFO queues only
  groupId?: string // FIFO queues only
}
