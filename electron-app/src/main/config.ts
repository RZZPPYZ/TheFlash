/**
 * Configuration manager — migrated from python-legacy/theflash/config.py.
 *
 * Reads/writes %APPDATA%/TheFlash/config.json with atomic write (tmp + rename),
 * identical structure to the legacy Python app so the same file is shared
 * by both editions without conversion.
 *
 * Fix vs legacy: DEFAULT_CONFIG is deep-cloned on read (python used a shallow
 * .copy(), which let nested dicts like `hotkey`/`window_geometry` be shared
 * and mutated — see python-legacy/theflash/config.py:53).
 */

import { app } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import type { AppConfig } from '../shared/types'
import { DEFAULT_CONFIG } from '../shared/types'
import { getDefaultSavePath } from './paths'

// Lazily computed — app.getPath() must run after 'ready', and importing this
// module must not depend on the app being initialized yet.
function configDir(): string {
  return join(app.getPath('appData'), 'TheFlash')
}
function configPath(): string {
  return join(configDir(), 'config.json')
}

export class Config {
  private data: AppConfig

  constructor() {
    this.data = this.load()
  }

  private load(): AppConfig {
    return this.readSync()
  }

  private async readAsync(): Promise<AppConfig> {
    try {
      const raw = await fs.readFile(configPath(), 'utf-8')
      const parsed = JSON.parse(raw) as Partial<AppConfig>
      return this.mergeWithDefaults(parsed)
    } catch {
      // Missing or corrupt — write defaults and return.
      const fresh = this.freshDefaults()
      void this.save(fresh)
      return fresh
    }
  }

  private readSync(): AppConfig {
    // Synchronous load at startup. readFileSync via a thin wrapper.
    const fsSync = require('fs') as typeof import('fs')
    try {
      const raw = fsSync.readFileSync(configPath(), 'utf-8')
      const parsed = JSON.parse(raw) as Partial<AppConfig>
      return this.mergeWithDefaults(parsed)
    } catch {
      const fresh = this.freshDefaults()
      try {
        this.saveSync(fresh)
      } catch {
        // best-effort
      }
      return fresh
    }
  }

  /** Reload from disk (e.g. after external edit). */
  async reload(): Promise<void> {
    this.data = await this.readAsync()
  }

  get(): AppConfig {
    return this.data
  }

  /** Deep clone so callers cannot mutate the internal state. */
  snapshot(): AppConfig {
    return structuredClone(this.data)
  }

  set(partial: Partial<AppConfig>): void {
    this.data = { ...this.data, ...partial }
    this.saveSync(this.data)
  }

  setGeometry(geo: Partial<AppConfig['window_geometry']>): void {
    this.data = {
      ...this.data,
      window_geometry: { ...this.data.window_geometry, ...geo }
    }
    this.saveSync(this.data)
  }

  saveSync(cfg: AppConfig): void {
    const fsSync = require('fs') as typeof import('fs')
    const p = configPath()
    const tmp = p + '.tmp'
    fsSync.mkdirSync(configDir(), { recursive: true })
    fsSync.writeFileSync(tmp, JSON.stringify(cfg, null, 2), 'utf-8')
    fsSync.renameSync(tmp, p) // atomic on NTFS
  }

  async save(cfg: AppConfig): Promise<void> {
    const p = configPath()
    const tmp = p + '.tmp'
    await fs.mkdir(configDir(), { recursive: true })
    await fs.writeFile(tmp, JSON.stringify(cfg, null, 2), 'utf-8')
    await fs.rename(tmp, p)
  }

  private freshDefaults(): AppConfig {
    const d = structuredClone(DEFAULT_CONFIG)
    d.save_path = getDefaultSavePath()
    return d
  }

  /** Deep-merge partial config over defaults (one level + known nested keys). */
  private mergeWithDefaults(parsed: Partial<AppConfig>): AppConfig {
    const base = this.freshDefaults()
    const merged: AppConfig = {
      version: parsed.version ?? base.version,
      hotkey: { ...base.hotkey, ...(parsed.hotkey ?? {}) },
      save_path: parsed.save_path || base.save_path,
      window_geometry: { ...base.window_geometry, ...(parsed.window_geometry ?? {}) },
      always_on_top: parsed.always_on_top ?? base.always_on_top,
      auto_save_on_close: parsed.auto_save_on_close ?? base.auto_save_on_close,
      start_minimized_to_tray: parsed.start_minimized_to_tray ?? base.start_minimized_to_tray,
      theme: parsed.theme === 'light' ? 'light' : 'dark'
    }
    // Ensure save path is set if the legacy file omitted it.
    if (!merged.save_path) merged.save_path = base.save_path
    return merged
  }
}
