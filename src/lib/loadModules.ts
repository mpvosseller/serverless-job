import glob from 'glob'
import path from 'path'
import { ServerlessJob } from './ServerlessJob'

export default function loadModules(pattern: string): void {
  if (ServerlessJob.getConfig().debug) {
    console.log(`Loading job modules: ${pattern}`)
    console.log(`__dirname: ${__dirname}`)
  }
  glob.sync(pattern).forEach(function (file: string) {
    const filePath = path.resolve(file)
    if (ServerlessJob.getConfig().debug) {
      console.log(`${file}: require(${filePath})`)
    }
    require(filePath)
  })
}
