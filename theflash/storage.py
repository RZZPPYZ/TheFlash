"""Note persistence — save, load, list, and delete timestamped .md files."""

import os
from pathlib import Path
from datetime import datetime
from typing import Optional
from theflash.utils import format_timestamp, ensure_directory


class NoteManager:
    """Manages note file CRUD operations in the configured save directory."""

    def __init__(self, save_path: Path):
        self._save_path = ensure_directory(save_path)

    # ------------------------------------------------------------------
    # Core operations
    # ------------------------------------------------------------------

    def save(self, text: str, filepath: Optional[Path] = None) -> Path:
        """Save note text to a timestamped .md file. Returns the file path."""
        if filepath is None:
            filepath = self._new_note_path()

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(text)

        return filepath

    def load(self, filepath: Path) -> str:
        """Read a note file's contents."""
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()

    def list(self, limit: int = 50, offset: int = 0) -> list[dict]:
        """List recent notes sorted newest-first.

        Returns list of {filepath, title, created, size_bytes}.
        """
        entries = []
        for f in sorted(self._save_path.glob("*.md"), reverse=True):
            try:
                stat = f.stat()
                entries.append({
                    "filepath": f,
                    "title": self._extract_title(f),
                    "created": datetime.fromtimestamp(stat.st_ctime),
                    "modified": datetime.fromtimestamp(stat.st_mtime),
                    "size_bytes": stat.st_size,
                })
            except OSError:
                continue

        return entries[offset: offset + limit]

    def delete(self, filepath: Path) -> bool:
        """Delete a note file. Returns True on success."""
        try:
            os.remove(filepath)
            return True
        except OSError:
            return False

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _new_note_path(self) -> Path:
        """Generate a unique timestamped file path."""
        base = self._save_path / f"{format_timestamp()}.md"
        if not base.exists():
            return base
        # Collision: append -2, -3, etc. (same-second saves)
        stem = format_timestamp()
        counter = 2
        while True:
            candidate = self._save_path / f"{stem}-{counter}.md"
            if not candidate.exists():
                return candidate
            counter += 1

    @staticmethod
    def _extract_title(filepath: Path) -> str:
        """Extract the first meaningful line of a note as its title."""
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                for line in f:
                    stripped = line.strip()
                    if not stripped:
                        continue
                    # Strip leading markdown heading markers
                    title = stripped.lstrip("#").strip()
                    if title:
                        return title[:60] + ("…" if len(title) > 60 else "")
            return "Untitled"
        except OSError:
            return "Untitled"

    @staticmethod
    def extract_title_from_text(text: str) -> str:
        """Extract title from raw note text."""
        for line in text.split("\n"):
            stripped = line.strip()
            if not stripped:
                continue
            title = stripped.lstrip("#").strip()
            if title:
                return title[:60] + ("…" if len(title) > 60 else "")
        return "Untitled"