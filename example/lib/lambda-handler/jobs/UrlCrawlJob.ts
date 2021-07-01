import fetch from 'node-fetch'
import { BaseJob, Job } from 'serverless-job'
import { MailJob } from './MailJob'

@Job()
export class UrlCrawlJob extends BaseJob {
  async perform(url: string): Promise<void> {
    console.log(`${new Date().toString()} Running UrlCrawlJob: ${url}`)
    const result = await fetch(url)
    const text = await result.text()
    void MailJob.performLater({
      emailAddress: 'me@example.com',
      subject: 'some subject',
      body: text,
    })
  }
}
