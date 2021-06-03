import { BaseJob, Job } from 'serverless-job'

@Job()
export class LogJob extends BaseJob {
  async perform(msg: string): Promise<void> {
    console.log(msg)
  }
}
