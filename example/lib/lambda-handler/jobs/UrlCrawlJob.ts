import fetch from 'node-fetch'
import { BaseJob, Job } from 'serverless-job'
import { MailJob } from './MailJob'

@Job()
export class UrlCrawlJob extends BaseJob {
  async perform(url: string): Promise<void> {
    const result = await fetch(url)
    const text = await result.text()
    MailJob.performLater({
      emailAddress: 'me@example.com',
      subject: 'some subject',
      body: text,
    })
  }
}
