import glob from 'glob'
import path from 'path'

export default function loadModules(pattern: string): void {
  glob.sync(pattern).forEach(function (file: string) {
    require(path.resolve(file))
  })
}
