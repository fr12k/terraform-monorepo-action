import * as core from '@actions/core'
import ignore from 'ignore'
import { getAllModules } from './allModules'
import { getChangedModules } from './changedModules'

async function run(): Promise<void> {
  try {
    const token = core.getInput('token', { required: true })
    const mode = core.getInput('mode', { required: true })
    const ignored = core.getInput('ignore') as string
    const includes = core.getInput('includes') as string
    const monitored = core
      .getInput('monitored')
      .split(',')
      .map((item: string) => item.trim())

    let modules: string[]

    switch (mode) {
      case 'all':
        modules = await getAllModules(token, monitored)
        break

      case 'changed':
        modules = await getChangedModules(token, monitored)
        break

      default:
        throw new Error(`Unknown mode: ${mode}`)
    }

    if (ignored) {
      const globs = ignored.split('\n').map((item) => item.trim())
      const nonEmptyModules = modules.filter(
        (module) => module !== null && module !== undefined && module !== '',
      )
      modules = ignore().add(globs).filter(nonEmptyModules)
    }

    if (includes) {
      const globs = includes.split('\n').map((item) => item.trim())
      const filteredModules = modules.filter(
        (module) => module !== null && module !== undefined && module !== '',
      )
      const ignores = ignore().add(globs)

      modules = filteredModules.filter((module) => ignores.ignores(module))
    }

    if (modules.length) {
      core.debug(`Found modules:${modules.map((module) => `\n- ${module}`)}`)
    } else {
      core.debug('No modules found')
    }

    core.setOutput('modules', modules)
  } catch (error: any) {
    core.setFailed(error.message)
  }
}

run()
