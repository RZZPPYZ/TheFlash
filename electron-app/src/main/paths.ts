/**
 * Path helpers — mirror python-legacy/theflash/utils.py:
 *   get_appdata_dir()     → %APPDATA%/TheFlash
 *   get_default_save_path() → %USERPROFILE%/Documents/TheFlash_Notes
 */

import { join } from 'path'

export function getDefaultSavePath(): string {
  return join('D:', 'TheFlash_Notes')
}
