import { BaseJob, Job } from 'serverless-job'

@Job()
export class MailJob extends BaseJob {
  async perform({
    emailAddress,
    subject,
    body,
  }: {
    emailAddress: string
    subject: string
    body: string
  }): Promise<void> {
    console.log(`sending email to ${emailAddress} with subject ${subject}`)
    console.log(body)
  }
}
