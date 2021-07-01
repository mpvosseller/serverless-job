import { Poller } from 'serverless-job/dist/lib/Poller'
import { app } from './lambda-handler/index'

// run local koa server
app.listen(3000)

// start polling the default queue
new Poller({
  purgeOnStart: true, // remove any events from last run 
})
