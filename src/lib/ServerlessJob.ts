import { SQSEvent } from 'aws-lambda'
import { SQS } from 'aws-sdk'
import { Logger } from './CloudWatchMetricLogger'
import { Event } from './Event'
import { Handler } from './Handler'
import loadModules from './loadModules'

type Config = {
  defaultQueueName?: string
  jobs?: string
  maxAttempts: number
  sqs?: SQS.Types.ClientConfiguration
  xRayTracing?: boolean
  debug?: boolean
  metricsAppName: string
  metricsNameSpace: string
  metricsLogger: Logger
}

const defaultConfig: Config = {
  maxAttempts: 13,
  metricsAppName: 'Unknown',
  metricsNameSpace: 'Serverless-Job',
  metricsLogger: console,
}

export class ServerlessJob {
  private static config = defaultConfig

  static configure(config: Partial<Config>): void {
    this.config = {
      ...defaultConfig,
      ...config,
    }

    // load all job modules to ensure each gets registered via their @Job() annotation
    const jobsPattern = config.jobs
    if (jobsPattern) {
      loadModules(jobsPattern)
    }
  }

  static getConfig(): Config {
    return this.config
  }

  static getDefaultQueueName(): string {
    const name = this.getConfig().defaultQueueName
    if (!name) {
      throw new Error('failed to find default queue name')
    }
    return name
  }

  static isJobEvent(event: unknown): boolean {
    return Event.isJobEvent(event)
  }

  static async handleEvent(event: unknown): Promise<unknown> {
    return Handler.handleEvent(event as SQSEvent)
  }
}
