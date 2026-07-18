"""Editor window — pre-created, pre-withdrawn tkinter Toplevel for instant note capture.

Design: The window is built ONCE at app startup and then shown/hidden via
deiconify()/withdraw(). This makes wake-up near-instant (<5ms vs ~200ms for
creating a new Toplevel each time).
"""

import tkinter as tk
from tkinter import messagebox, ttk
from pathlib import Path
from typing import Optional, Callable
from theflash.ui.theme import DARK_THEME, LIGHT_THEME, EDITOR_FONT, UI_FONT, STATUS_FONT
from theflash.utils import get_cursor_pos


class EditorWindow:
    """The main flash-note editor. Pre-created, hidden, summoned by hotkey."""

    def __init__(
        self,
        root: tk.Tk,
        save_path: Path,
        *,
        on_save: Optional[Callable[[str], None]] = None,
        on_hide: Optional[Callable[[], None]] = None,
        always_on_top: bool = True,
        dark_mode: bool = True,
        geometry: Optional[dict] = None,
    ):
        self._root = root
        self._save_path = save_path
        self._on_save_callback = on_save
        self._on_hide_callback = on_hide
        self._dark_mode = dark_mode
        self._theme = DARK_THEME if dark_mode else LIGHT_THEME
        self._modified = False
        self._current_file: Optional[Path] = None

        # Create the window
        self._window = tk.Toplevel(root)
        self._window.title("The Flash")
        self._window.protocol("WM_DELETE_WINDOW", self.hide)

        # Apply theme colors
        self._window.configure(bg=self._theme["bg"])

        # Geometry
        geo = geometry or {}
        w = geo.get("width", 520)
        h = geo.get("height", 400)
        self._window.minsize(300, 180)

        # Always on top
        if always_on_top:
            self._window.attributes("-topmost", True)

        # Build UI
        self._build_title_bar()
        self._build_editor()
        self._build_status_bar()

        # Bind keys
        self._bind_keys()

        # Center and hide
        self._window.update_idletasks()
        screen_w = self._window.winfo_screenwidth()
        screen_h = self._window.winfo_screenheight()
        x = (screen_w - w) // 2
        y = (screen_h - h) // 2
        self._window.geometry(f"{w}x{h}+{x}+{y}")
        self._window.withdraw()

    # ------------------------------------------------------------------
    # UI Construction
    # ------------------------------------------------------------------

    def _build_title_bar(self):
        """Build a compact custom title bar."""
        t = self._theme
        bar = tk.Frame(
            self._window,
            bg=t["title_bar_bg"],
            height=32,
            cursor="fleur",
        )
        bar.pack(fill=tk.X, side=tk.TOP)
        bar.pack_propagate(False)

        # App label
        self._title_label = tk.Label(
            bar,
            text="⚡ The Flash",
            bg=t["title_bar_bg"],
            fg=t["accent"],
            font=("Segoe UI", 9, "bold"),
        )
        self._title_label.pack(side=tk.LEFT, padx=(10, 0), pady=4)

        # Modified indicator
        self._modified_indicator = tk.Label(
            bar,
            text="",
            bg=t["title_bar_bg"],
            fg=t["warning"],
            font=("Segoe UI", 8),
        )
        self._modified_indicator.pack(side=tk.LEFT, padx=(6, 0), pady=4)

        # Close button
        close_btn = tk.Label(
            bar,
            text="✕",
            bg=t["title_bar_bg"],
            fg=t["title_bar_fg"],
            font=("Segoe UI", 12),
            cursor="hand2",
        )
        close_btn.pack(side=tk.RIGHT, padx=(0, 10), pady=4)
        close_btn.bind("<Button-1>", lambda e: self.hide())
        close_btn.bind("<Enter>", lambda e: close_btn.configure(fg=t["error"]))
        close_btn.bind("<Leave>", lambda e: close_btn.configure(fg=t["title_bar_fg"]))

        # Drag to move
        bar.bind("<Button-1>", self._start_drag)
        bar.bind("<B1-Motion>", self._on_drag)
        self._title_label.bind("<Button-1>", self._start_drag)
        self._title_label.bind("<B1-Motion>", self._on_drag)

    def _build_editor(self):
        """Build the main text editing area."""
        t = self._theme
        frame = tk.Frame(self._window, bg=t["bg"])
        frame.pack(fill=tk.BOTH, expand=True, padx=2, pady=(0, 2))

        # Text widget with scrollbar
        self._text = tk.Text(
            frame,
            wrap=tk.WORD,
            undo=True,
            maxundo=50,
            borderwidth=0,
            padx=12,
            pady=12,
            insertbackground=t["insertbackground"],
            bg=t["bg"],
            fg=t["fg"],
            selectbackground=t["select_bg"],
            selectforeground=t["select_fg"],
            font=EDITOR_FONT,
            tabs=("1c", "2c", "3c", "4c"),
        )

        scrollbar = ttk.Scrollbar(
            frame,
            orient=tk.VERTICAL,
            command=self._text.yview,
        )
        self._text.configure(yscrollcommand=scrollbar.set)

        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self._text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        # Track modifications
        self._text.bind("<<Modified>>", self._on_modified)

    def _build_status_bar(self):
        """Build the bottom status bar with save button and word count."""
        t = self._theme
        bar = tk.Frame(
            self._window,
            bg=t["status_bar_bg"],
            height=34,
        )
        bar.pack(fill=tk.X, side=tk.BOTTOM)
        bar.pack_propagate(False)

        # Save button
        self._save_btn = tk.Label(
            bar,
            text="  Save  ",
            bg=t["button_bg"],
            fg=t["button_fg"],
            font=UI_FONT,
            cursor="hand2",
        )
        self._save_btn.pack(side=tk.LEFT, padx=(10, 0), pady=5)
        self._save_btn.bind("<Button-1>", lambda e: self.save_and_hide())
        self._save_btn.bind("<Enter>", lambda e: self._save_btn.configure(bg=t["button_active_bg"]))
        self._save_btn.bind("<Leave>", lambda e: self._save_btn.configure(bg=t["button_bg"]))

        # Cancel button
        cancel_btn = tk.Label(
            bar,
            text="  Cancel  ",
            bg=t["button_bg"],
            fg=t["button_fg"],
            font=UI_FONT,
            cursor="hand2",
        )
        cancel_btn.pack(side=tk.LEFT, padx=(6, 0), pady=5)
        cancel_btn.bind("<Button-1>", lambda e: self.hide())
        cancel_btn.bind("<Enter>", lambda e: cancel_btn.configure(bg=t["button_active_bg"]))
        cancel_btn.bind("<Leave>", lambda e: cancel_btn.configure(bg=t["button_bg"]))

        # Word count
        self._word_count_label = tk.Label(
            bar,
            text="0 words",
            bg=t["status_bar_bg"],
            fg=t["status_bar_fg"],
            font=STATUS_FONT,
        )
        self._word_count_label.pack(side=tk.RIGHT, padx=(0, 10), pady=5)

        # Saved indicator
        self._saved_label = tk.Label(
            bar,
            text="",
            bg=t["status_bar_bg"],
            fg=t["success"],
            font=STATUS_FONT,
        )
        self._saved_label.pack(side=tk.RIGHT, padx=(0, 6), pady=5)

        # Bind word count update
        self._text.bind("<KeyRelease>", self._update_word_count)

    # ------------------------------------------------------------------
    # Key bindings
    # ------------------------------------------------------------------

    def _bind_keys(self):
        """Set up keyboard shortcuts."""
        w = self._window
        t = self._text

        # Save and hide
        w.bind("<Control-s>", lambda e: self.save_and_hide())
        w.bind("<Control-S>", lambda e: self.save_and_hide())
        w.bind("<Control-Return>", lambda e: self.save_and_hide())

        # Hide / cancel
        w.bind("<Escape>", lambda e: self.hide())

        # Select all
        w.bind("<Control-a>", self._select_all)
        w.bind("<Control-A>", self._select_all)

        # Undo / Redo
        w.bind("<Control-z>", lambda e: self._try_undo())
        w.bind("<Control-Z>", lambda e: self._try_undo())
        w.bind("<Control-y>", lambda e: self._try_redo())
        w.bind("<Control-Y>", lambda e: self._try_redo())

    @staticmethod
    def _select_all(event):
        event.widget.focus_get()
        if isinstance(event.widget, tk.Text):
            event.widget.tag_add(tk.SEL, "1.0", tk.END)
            event.widget.mark_set(tk.INSERT, "1.0")
            event.widget.see(tk.INSERT)
        return "break"

    def _try_undo(self):
        try:
            self._text.edit_undo()
        except tk.TclError:
            pass

    def _try_redo(self):
        try:
            self._text.edit_redo()
        except tk.TclError:
            pass

    # ------------------------------------------------------------------
    # Visibility
    # ------------------------------------------------------------------

    def show(self):
        """Show the editor window. Clear previous content, position near cursor."""
        # If already visible, just bring to front
        if self._window.state() == "normal":
            self._window.lift()
            self._window.focus_force()
            self._text.focus_set()
            return

        # Clear previous content (already-saved notes are cleared)
        self.clear()

        # Position near cursor
        try:
            cx, cy = get_cursor_pos()
            self._window.update_idletasks()
            w = self._window.winfo_width()
            h = self._window.winfo_height()
            x = cx - w // 2
            y = cy - 40  # slightly above cursor
            # Clamp to screen
            sw = self._window.winfo_screenwidth()
            sh = self._window.winfo_screenheight()
            x = max(0, min(x, sw - w))
            y = max(0, min(y, sh - h))
            self._window.geometry(f"+{x}+{y}")
        except Exception:
            pass

        self._window.deiconify()
        self._window.lift()
        self._window.focus_force()
        self._text.focus_set()
        self._modified = False
        self._update_modified_indicator()
        self._update_word_count()

    def hide(self):
        """Hide the editor, optionally handling unsaved changes."""
        if self._window.state() == "withdrawn":
            return

        if self._modified and self.has_content():
            answer = messagebox.askyesnocancel(
                "Unsaved changes",
                "You have unsaved changes.\n\n"
                "Yes = Save now\n"
                "No = Discard changes\n"
                "Cancel = Keep editing",
                parent=self._window,
            )
            if answer is True:  # Yes — save
                self._do_save()
            elif answer is None:  # Cancel
                return
            # No = discard, fall through

        self._window.withdraw()
        self._current_file = None
        if self._on_hide_callback:
            self._on_hide_callback()

    def save_and_hide(self):
        """Save the current note and hide the window."""
        if not self.has_content():
            # Don't save empty notes
            self._window.withdraw()
            if self._on_hide_callback:
                self._on_hide_callback()
            return

        saved_path = self._do_save()
        if saved_path:
            self._flash_saved()
            self._window.withdraw()
            self._current_file = None
            if self._on_hide_callback:
                self._on_hide_callback()

    # ------------------------------------------------------------------
    # Save / Load
    # ------------------------------------------------------------------

    def _do_save(self) -> Optional[Path]:
        """Persist the current text to a timestamped file. Returns the path."""
        from theflash.storage import NoteManager

        text = self.get_text()
        if not text.strip():
            return None

        nm = NoteManager(self._save_path)
        filepath = nm.save(text, filepath=self._current_file)
        self._current_file = filepath
        self._modified = False
        self._update_modified_indicator()

        if self._on_save_callback:
            self._on_save_callback(text)

        return filepath

    def load_note(self, filepath: Path):
        """Load an existing note into the editor."""
        from theflash.storage import NoteManager

        nm = NoteManager(self._save_path)
        text = nm.load(filepath)
        self._text.delete("1.0", tk.END)
        self._text.insert("1.0", text)
        self._current_file = filepath
        self._modified = False
        self._text.edit_modified(False)
        self._update_modified_indicator()
        self._update_word_count()

    # ------------------------------------------------------------------
    # Content accessors
    # ------------------------------------------------------------------

    def get_text(self) -> str:
        return self._text.get("1.0", "end-1c")

    def set_text(self, text: str):
        self._text.delete("1.0", tk.END)
        if text:
            self._text.insert("1.0", text)

    def clear(self):
        """Clear the editor to a blank state."""
        self._text.delete("1.0", tk.END)
        self._current_file = None
        self._modified = False
        self._text.edit_modified(False)
        self._update_modified_indicator()
        self._update_word_count()

    def has_content(self) -> bool:
        return bool(self.get_text().strip())

    # ------------------------------------------------------------------
    # UI updates
    # ------------------------------------------------------------------

    def _on_modified(self, event=None):
        if self._text.edit_modified():
            self._modified = True
            self._update_modified_indicator()
            self._text.edit_modified(False)

    def _update_modified_indicator(self):
        if self._modified:
            self._modified_indicator.configure(text="● Unsaved")
        else:
            self._modified_indicator.configure(text="")

    def _update_word_count(self, event=None):
        text = self.get_text()
        words = len(text.split()) if text.strip() else 0
        chars = len(text)
        self._word_count_label.configure(text=f"{words} words · {chars} chars")

    def _flash_saved(self):
        """Briefly show 'Saved' indicator."""
        self._saved_label.configure(text="✓ Saved")
        self._window.after(1500, lambda: self._saved_label.configure(text=""))

    # ------------------------------------------------------------------
    # Window drag
    # ------------------------------------------------------------------

    def _start_drag(self, event):
        self._drag_x = event.x_root
        self._drag_y = event.y_root

    def _on_drag(self, event):
        dx = event.x_root - self._drag_x
        dy = event.y_root - self._drag_y
        self._drag_x = event.x_root
        self._drag_y = event.y_root
        x = self._window.winfo_x() + dx
        y = self._window.winfo_y() + dy
        self._window.geometry(f"+{x}+{y}")

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def destroy(self):
        """Destroy the window (only on app exit)."""
        self._window.destroy()

    def save_geometry(self) -> dict:
        """Return current geometry for config persistence."""
        try:
            if self._window.state() == "normal":
                return {
                    "x": self._window.winfo_x(),
                    "y": self._window.winfo_y(),
                    "width": self._window.winfo_width(),
                    "height": self._window.winfo_height(),
                }
        except tk.TclError:
            pass
        return {}

    @property
    def window(self):
        return self._window