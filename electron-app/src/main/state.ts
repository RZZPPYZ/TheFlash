/**
 * Process-wide singletons for the main process.
 *
 * The Config is created lazily because it needs app.getPath(), which is only
 * valid after app.whenReady(). Modules obtain the instance via getConfig()
 * / getNoteManager(), and bootstrap() calls init() once the app is ready.
 */

import { Config } from './config'
import { NoteManager } from './storage'
import { DraftManager } from './draft'
import { getDefaultSavePath } from './paths'

let configInstance: Config | null = null
let draftInstance: DraftManager | null = null

/** Construct the singletons. Call once after app.whenReady(). */
export function init(): void {
  if (configInstance) return
  configInstance = new Config()
  draftInstance = new DraftManager()
  draftInstance.init()
}

export function getConfig(): Config {
  if (!configInstance) {
    // Defensive: some call site (e.g. before-quit) may run before init in
    // an edge case — create on demand. app is ready by then.
    configInstance = new Config()
  }
  return configInstance
}

export function configData() {
  return getConfig().get()
}

export function getNoteManager(): NoteManager {
  return new NoteManager(getConfig().get().save_path || getDefaultSavePath())
}

export function getDraftManager(): DraftManager {
  if (!draftInstance) {
    draftInstance = new DraftManager()
    draftInstance.init()
  }
  return draftInstance
}
