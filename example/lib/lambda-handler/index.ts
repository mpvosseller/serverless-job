/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
import Router from '@koa/router'
import { Context } from 'aws-lambda'
import Koa, { Context as KoaContext } from 'koa'
import serverless from 'serverless-http'
import { ServerlessJob } from 'serverless-job'
import { UrlCrawlJob } from './jobs/UrlCrawlJob'
import 'source-map-support/register'

ServerlessJob.configure({
  defaultQueueName: process.env.JOB_QUEUE_NAME,
  jobs: 'jobs/**/*.js',
})

const app = createKoaApp()
const httpHandler = serverless(app)

function createKoaApp(): Koa {
  const app = new Koa()
  const router = new Router()
  router.post('/crawl', async (ctx: KoaContext) => {
    const url = ctx.request.query['url']
    if (url) {
      await UrlCrawlJob.performLater(url.toString())
      ctx.body = `Crawling scheudled for ${url.toString()}`
    }
  })
  app.use(router.routes())
  app.use(router.allowedMethods())
  return app
}

export async function handler(event: any, context: Context): Promise<unknown> {
  if (ServerlessJob.isJobEvent(event)) {
    await ServerlessJob.handleEvent(event)
    return
  }
  return httpHandler(event, context)
}
