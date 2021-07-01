import { BaseJob, Job } from 'serverless-job'

@Job()
export class MailJob extends BaseJob {
  // eslint-disable-next-line @typescript-eslint/require-await
  async perform({
    emailAddress,
    subject,
    body,
  }: {
    emailAddress: string
    subject: string
    body: string
  }): Promise<void> {
    console.log(`${new Date().toString()} Running MailJob`)
    console.log(`TO: ${emailAddress}`)
    console.log(`SUBJECT: ${subject}`)
    console.log('BODY:')
    console.log(body)
  }
}
