"""App theme — color scheme and font constants for the dark theme."""

DARK_THEME = {
    "bg": "#1e1e2e",            # Dark navy-gray background
    "fg": "#cdd6f4",            # Light text
    "insertbackground": "#cdd6f4",  # Cursor color
    "select_bg": "#45475a",      # Selection background
    "select_fg": "#cdd6f4",      # Selection text
    "button_bg": "#313244",      # Button background
    "button_fg": "#cdd6f4",      # Button text
    "button_active_bg": "#45475a",
    "entry_bg": "#313244",
    "entry_fg": "#cdd6f4",
    "frame_bg": "#1e1e2e",
    "border": "#45475a",
    "title_bar_bg": "#181825",
    "title_bar_fg": "#cdd6f4",
    "status_bar_bg": "#181825",
    "status_bar_fg": "#a6adc8",
    "accent": "#89b4fa",         # Blue accent for highlights
    "warning": "#f9e2af",        # Yellow for unsaved states
    "error": "#f38ba8",          # Red for errors
    "success": "#a6e3a1",        # Green for success indicators
}

LIGHT_THEME = {
    "bg": "#eff1f5",
    "fg": "#4c4f69",
    "insertbackground": "#4c4f69",
    "select_bg": "#ccd0da",
    "select_fg": "#4c4f69",
    "button_bg": "#e6e9ef",
    "button_fg": "#4c4f69",
    "button_active_bg": "#ccd0da",
    "entry_bg": "#e6e9ef",
    "entry_fg": "#4c4f69",
    "frame_bg": "#eff1f5",
    "border": "#ccd0da",
    "title_bar_bg": "#dce0e8",
    "title_bar_fg": "#4c4f69",
    "status_bar_bg": "#dce0e8",
    "status_bar_fg": "#6c6f85",
    "accent": "#1e66f5",
    "warning": "#df8e1d",
    "error": "#d20f39",
    "success": "#40a02b",
}

# Font configuration
EDITOR_FONT = ("Cascadia Code", 12)
EDITOR_FONT_FALLBACK = ("Consolas", 12)
UI_FONT = ("Segoe UI", 10)
TITLE_FONT = ("Segoe UI", 9)
STATUS_FONT = ("Segoe UI", 8)


def get_theme(dark: bool = True) -> dict:
    """Return the active theme dictionary."""
    return DARK_THEME if dark else LIGHT_THEME