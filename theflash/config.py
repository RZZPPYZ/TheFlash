"""Configuration manager — JSON-based settings with atomic writes."""

import json
import os
import shutil
from pathlib import Path
from theflash.utils import get_appdata_dir, get_default_save_path, ensure_directory

DEFAULT_CONFIG = {
    "version": 1,
    "hotkey": {
        "modifiers": ["Ctrl", "Shift"],
        "key": "F",
    },
    "save_path": str(get_default_save_path()),
    "window_geometry": {
        "x": None,
        "y": None,
        "width": 520,
        "height": 400,
    },
    "always_on_top": True,
    "auto_save_on_close": False,
    "start_minimized_to_tray": True,
    "theme": "dark",
}


class Config:
    """Manages application configuration stored at %APPDATA%/TheFlash/config.json."""

    def __init__(self):
        self._config_dir = get_appdata_dir()
        self._config_path = self._config_dir / "config.json"
        self._data: dict = {}
        self.load()

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def load(self):
        """Load config from disk, creating defaults if the file is missing or corrupt."""
        if self._config_path.exists():
            try:
                with open(self._config_path, "r", encoding="utf-8") as f:
                    self._data = json.load(f)
                self._migrate()
            except (json.JSONDecodeError, OSError):
                self._data = DEFAULT_CONFIG.copy()
                self.save()
        else:
            self._data = DEFAULT_CONFIG.copy()
            self.save()

    def save(self):
        """Atomically write config to disk (write-tmp + rename)."""
        ensure_directory(self._config_dir)
        tmp = self._config_path.with_suffix(".tmp")
        try:
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(self._data, f, indent=2, ensure_ascii=False)
            os.replace(tmp, self._config_path)  # atomic on NTFS
        except OSError:
            # Fallback: direct write
            with open(self._config_path, "w", encoding="utf-8") as f:
                json.dump(self._data, f, indent=2, ensure_ascii=False)

    def _migrate(self):
        """Handle config format upgrades based on version field."""
        version = self._data.get("version", 0)
        if version < 1:
            # future migration logic here
            pass
        self._data.setdefault("version", 1)

    # ------------------------------------------------------------------
    # Accessors
    # ------------------------------------------------------------------

    def get(self, key: str, default=None):
        """Get a dot-path config value, e.g. 'hotkey.modifiers'."""
        keys = key.split(".")
        node = self._data
        for k in keys:
            if isinstance(node, dict):
                node = node.get(k)
            else:
                return default
            if node is None:
                return default
        return node

    def set(self, key: str, value):
        """Set a dot-path config value and persist immediately."""
        keys = key.split(".")
        node = self._data
        for k in keys[:-1]:
            if k not in node:
                node[k] = {}
            node = node[k]
        node[keys[-1]] = value
        self.save()

    def set_many(self, **kwargs):
        """Set multiple config values and persist once."""
        for key, value in kwargs.items():
            self._set_no_save(key, value)
        self.save()

    def _set_no_save(self, key: str, value):
        """Set a dot-path value without persisting (for batch updates)."""
        keys = key.split(".")
        node = self._data
        for k in keys[:-1]:
            if k not in node:
                node[k] = {}
            node = node[k]
        node[keys[-1]] = value

    # ------------------------------------------------------------------
    # Convenience properties
    # ------------------------------------------------------------------

    @property
    def hotkey_modifiers(self) -> list:
        return self.get("hotkey.modifiers", ["Ctrl", "Shift"])

    @property
    def hotkey_key(self) -> str:
        return self.get("hotkey.key", "F")

    @property
    def hotkey_string(self) -> str:
        mods = self.hotkey_modifiers
        key = self.hotkey_key
        return "+".join(mods + [key])

    @property
    def save_path(self) -> Path:
        p = Path(self.get("save_path", str(get_default_save_path())))
        ensure_directory(p)
        return p

    @property
    def always_on_top(self) -> bool:
        return self.get("always_on_top", True)

    @property
    def auto_save_on_close(self) -> bool:
        return self.get("auto_save_on_close", False)

    @property
    def theme(self) -> str:
        return self.get("theme", "dark")