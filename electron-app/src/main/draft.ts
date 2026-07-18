/**
 * Daily draft manager — persists unsaved text so it survives window hide / app crash.
 *
 * Draft file: %APPDATA%/TheFlash/draft.json
 * Schema: { date: "YYYY-MM-DD", text: "..." }
 *
 * Stale (yesterday's) drafts are ignored and overwritten on next save.
 * Atomic write (tmp + rename) prevents corruption on crash.
 */

import { app } from 'electron'
import { join } from 'path'

const fsSync = require('fs') as typeof import('fs')

interface DraftData {
  date: string
  text: string
}

function draftPath(): string {
  return join(app.getPath('appData'), 'TheFlash', 'draft.json')
}

function todayString(): string {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export class DraftManager {
  private cache: DraftData | null = null

  init(): void {
    this.cache = this.readFromDisk()
  }

  getText(): string | null {
    if (!this.cache || this.cache.date !== todayString()) return null
    return this.cache.text
  }

  save(text: string): void {
    if (!text || !text.trim()) {
      this.clear()
      return
    }
    const data: DraftData = { date: todayString(), text }
    this.cache = data
    this.writeToDisk(data)
  }

  clear(): void {
    this.cache = null
    try {
      fsSync.unlinkSync(draftPath())
    } catch {
      // file may not exist — that's fine
    }
  }

  private readFromDisk(): DraftData | null {
    try {
      const raw = fsSync.readFileSync(draftPath(), 'utf-8')
      const parsed = JSON.parse(raw) as DraftData
      if (parsed.date && typeof parsed.text === 'string') return parsed
      return null
    } catch {
      return null
    }
  }

  private writeToDisk(data: DraftData): void {
    const p = draftPath()
    const tmp = p + '.tmp'
    const dir = join(app.getPath('appData'), 'TheFlash')
    fsSync.mkdirSync(dir, { recursive: true })
    fsSync.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
    fsSync.renameSync(tmp, p)
  }
}
