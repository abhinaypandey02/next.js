#!/usr/bin/env node

import '../server/lib/cpu-profile'
import { existsSync } from 'fs'
import { italic } from '../lib/picocolors'
import build from '../build'
import * as Log from '../build/output/log'
import { printAndExit } from '../server/lib/utils'
import isError from '../lib/is-error'
import { getProjectDir } from '../lib/get-project-dir'

type NextBuildOptions = {
  debug?: boolean
  profile?: boolean
  lint: boolean
  mangling: boolean
  experimentalAppOnly?: boolean
  experimentalTurbo?: boolean
  buildMode: 'default' | 'experimental-compile' | 'experimental-generate'
}

const nextBuild = async (options: NextBuildOptions, directory?: string) => {
  process.on('SIGTERM', () => process.exit(0))
  process.on('SIGINT', () => process.exit(0))

  const {
    debug,
    profile,
    lint,
    mangling,
    experimentalAppOnly,
    experimentalTurbo,
    buildMode,
  } = options

  if (!lint) {
    Log.warn('Linting is disabled.')
  }

  if (!mangling) {
    Log.warn(
      'Mangling is disabled. Note: This may affect performance and should only be used for debugging purposes.'
    )
  }

  if (profile) {
    Log.warn(
      `Profiling is enabled. ${italic('Note: This may affect performance.')}`
    )
  }

  const dir = getProjectDir(directory)

  // Check if the provided directory exists
  if (!existsSync(dir)) {
    printAndExit(`> No such directory exists as the project root: ${dir}`)
  }

  if (debug) {
    process.env.NEXT_DEBUG_BUILD = '1'
  }

  if (experimentalTurbo) {
    process.env.TURBOPACK = '1'
  }

  return await build(
    dir,
    profile,
    debug,
    lint,
    !mangling,
    experimentalAppOnly,
    !!process.env.TURBOPACK,
    buildMode
  ).catch((err) => {
    console.error('')
    if (
      isError(err) &&
      (err.code === 'INVALID_RESOLVE_ALIAS' ||
        err.code === 'WEBPACK_ERRORS' ||
        err.code === 'BUILD_OPTIMIZATION_FAILED' ||
        err.code === 'NEXT_EXPORT_ERROR' ||
        err.code === 'NEXT_STATIC_GEN_BAILOUT' ||
        err.code === 'EDGE_RUNTIME_UNSUPPORTED_API')
    ) {
      printAndExit(`> ${err.message}`)
    } else {
      console.error('> Build error occurred')
      printAndExit(err)
    }
  })
}

export { nextBuild }
