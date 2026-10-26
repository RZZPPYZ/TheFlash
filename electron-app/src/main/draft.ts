/**
 * Daily draft manager — persists unsaved text so it survives window hide / app crash.
 *
 * Draft file: {save_path}/draft.json  (same folder as note .md files)
 * Schema: { date: "YYYY-MM-DD", text: "...", notePath: "..." | null }
 *
 * Stale (yesterday's) drafts are ignored and overwritten on next save.
 * Atomic write (tmp + rename) prevents corruption on crash.
 */

import { join } from 'path'
import type { DraftSnapshot } from '../shared/types'

const fsSync = require('fs') as typeof import('fs')

function todayString(): string {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export class DraftManager {
  constructor(private savePath: string) {}
  private cache: DraftSnapshot | null = null

  private draftPath(): string {
    return join(this.savePath, 'draft.json')
  }

  init(): void {
    this.cache = this.readFromDisk()
  }

  getSnapshot(): DraftSnapshot | null {
    if (!this.cache || this.cache.date !== todayString()) return null
    return { ...this.cache }
  }

  save(text: string, notePath: string | null = null): void {
    if (!text || !text.trim()) {
      this.clear()
      return
    }
    const data: DraftSnapshot = { date: todayString(), text, notePath }
    this.cache = data
    this.writeToDisk(data)
  }

  clear(): void {
    this.cache = null
    try {
      fsSync.unlinkSync(this.draftPath())
    } catch {
      // file may not exist — that's fine
    }
  }

  private readFromDisk(): DraftSnapshot | null {
    try {
      const raw = fsSync.readFileSync(this.draftPath(), 'utf-8')
      const parsed = JSON.parse(raw) as Partial<DraftSnapshot>
      if (parsed.date && typeof parsed.text === 'string') {
        return {
          date: parsed.date,
          text: parsed.text,
          notePath: typeof parsed.notePath === 'string' ? parsed.notePath : null
        }
      }
      return null
    } catch {
      return null
    }
  }

  private writeToDisk(data: DraftSnapshot): void {
    const p = this.draftPath()
    const tmp = p + '.tmp'
    fsSync.mkdirSync(this.savePath, { recursive: true })
    fsSync.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
    fsSync.renameSync(tmp, p)
  }
}
