/* eslint-disable @typescript-eslint/no-explicit-any */
import Router from '@koa/router'
import { Context } from 'aws-lambda'
import Koa, { Context as KoaContext } from 'koa'
import serverless from 'serverless-http'
import { ServerlessJob } from 'serverless-job'
import 'source-map-support/register'
import { UrlCrawlJob } from './jobs/UrlCrawlJob'

ServerlessJob.configure({
  defaultQueueName: process.env.JOB_QUEUE_NAME,
  jobs: 'jobs/**/*.js',
})

export const app = createKoaApp()
const httpHandler = serverless(app)

function createKoaApp(): Koa {
  const app = new Koa()
  const router = new Router()
  router.post('/crawl', async (ctx: KoaContext) => {
    const url = ctx.request.query.url
    if (url) {
      await UrlCrawlJob.performLater(url.toString())
      ctx.body = `Crawling scheudled for ${url.toString()}`
    }
  })
  app.use(router.routes())
  app.use(router.allowedMethods())
  return app
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function handler(event: any, context: Context): Promise<unknown> {
  if (ServerlessJob.isJobEvent(event)) {
    return ServerlessJob.handleEvent(event)
  } else {
    return httpHandler(event, context)
  }
}
