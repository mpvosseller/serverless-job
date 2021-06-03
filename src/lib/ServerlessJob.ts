import { SQSEvent } from 'aws-lambda'
import { SQS } from 'aws-sdk'
import { Event } from './Event'
import { Handler } from './Handler'
import loadModules from './loadModules'
import { Poller } from './Poller'

type Config = {
  defaultQueueName?: string
  jobs?: string
  maxAttempts?: number
  sqs?: SQS.Types.ClientConfiguration
}

export class ServerlessJob {
  private static config: Config = {}

  static configure(config: Config): void {
    this.config = config

    // load all job modules to ensure each gets registered via their @Job() annotation
    const jobsPattern = config.jobs
    if (jobsPattern) {
      loadModules(jobsPattern)
    }
  }

  static getConfig(): Config {
    return this.config
  }

  static isJobEvent(event: unknown): boolean {
    return Event.isJobEvent(event)
  }

  static async handleEvent(event: unknown): Promise<unknown> {
    return Handler.handleEvent(event as SQSEvent)
  }

  static async poll(queueName?: string): Promise<SQSEvent | undefined> {
    return Poller.poll(queueName)
  }
}
