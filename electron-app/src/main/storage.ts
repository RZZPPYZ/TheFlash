/**
 * Note persistence — migrated from python-legacy/theflash/storage.py.
 *
 * Saves timestamped .md files: YYYY-MM-DD_HH-MM-SS.md
 * Same-second collisions append -2, -3, ... (identical to legacy).
 */

import { promises as fs } from 'fs'
import { join } from 'path'

export interface SaveOutcome {
  path: string
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

/** YYYY-MM-DD_HH-MM-SS — same format as python-legacy format_timestamp(). */
function formatTimestamp(d: Date = new Date()): string {
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
  )
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

const fsSync = require('fs') as typeof import('fs')

function todayPrefix(): string {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export interface TodayNote {
  filename: string
  time: string
  preview: string
  path: string
}

export class NoteManager {
  constructor(private savePath: string) {}

  /** Save text to a new timestamped .md file. Returns the absolute path. */
  async save(text: string): Promise<SaveOutcome> {
    await ensureDir(this.savePath)
    const filepath = await this.newNotePath()
    await fs.writeFile(filepath, text, 'utf-8')
    return { path: filepath }
  }

  /** Update an existing note file in-place. */
  async update(filepath: string, text: string): Promise<SaveOutcome> {
    await fs.writeFile(filepath, text, 'utf-8')
    return { path: filepath }
  }

  /** Count today's saved .md files in save_path. */
  getTodayCount(): number {
    const prefix = todayPrefix()
    try {
      const entries = fsSync.readdirSync(this.savePath) as string[]
      return entries.filter((f) => f.startsWith(prefix) && f.endsWith('.md')).length
    } catch {
      return 0
    }
  }

  /** List today's saved notes with preview. */
  getTodayNotes(): TodayNote[] {
    const prefix = todayPrefix()
    try {
      const entries = (fsSync.readdirSync(this.savePath) as string[])
        .filter((f) => f.startsWith(prefix) && f.endsWith('.md'))
        .sort()
        .reverse()
      return entries.map((f) => {
        const full = join(this.savePath, f)
        let preview = ''
        try {
          const content = fsSync.readFileSync(full, 'utf-8') as string
          preview = content.replace(/\n/g, ' ').slice(0, 120)
        } catch { /* ignore */ }
        const timePart = f.replace(/\.md$/, '').slice(11)
        const [h, m] = timePart.split('-')
        const time = `${h}:${m}`
        return { filename: f, time, preview, path: full }
      })
    } catch {
      return []
    }
  }

  private async newNotePath(): Promise<string> {
    const base = join(this.savePath, `${formatTimestamp()}.md`)
    if (!(await pathExists(base))) return base
    // Collision: append -2, -3, ...
    const stem = formatTimestamp()
    let counter = 2
    for (;;) {
      const candidate = join(this.savePath, `${stem}-${counter}.md`)
      if (!(await pathExists(candidate))) return candidate
      counter++
    }
  }

  async load(filepath: string): Promise<string> {
    return fs.readFile(filepath, 'utf-8')
  }

  async delete(filepath: string): Promise<boolean> {
    try {
      await fs.unlink(filepath)
      return true
    } catch {
      return false
    }
  }
}
