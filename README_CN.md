# ⚡ The Flash

**Windows 上的闪电速记工具。**

[English](README.md) | [中文](README_CN.md)

---

**Windows 上的闪电速记工具。** 按下全局快捷键，写下灵感，保存，回去继续你手头的事——几秒搞定。

### 功能特性

- **秒开唤起** — `Ctrl+Shift+F` 从任何应用唤出编辑器
- **每日草稿** — 未保存的文本自动暂存，同天再次打开自动恢复
- **全部笔记侧边栏** — 唤起时默认展示所有日期的已保存笔记，点击即可重新编辑
- **完整 Markdown 编辑器** — CodeMirror 语法高亮，并提供 H1–H6、粗体、斜体、下划线、删除线、引用、列表、任务、链接、图片、代码、表格、分隔线和 Mermaid 工具栏
- **Markdown / Mermaid 预览** — 渲染 GFM Markdown、流程图、时序图等 Mermaid 图表
- **原地保存** — 唤起/隐藏后保留原笔记路径，编辑已保存的笔记时更新原文件，不会重复创建
- **删除笔记** — 悬停侧边栏任意条目即可删除
- **合并笔记** — `Ctrl+点击` 多选侧边栏笔记，然后 `Ctrl+E` 使用 Markdown 分隔线合并
- **字体缩放** — `Ctrl+滚轮` 调整编辑器字体大小（9–32px，自动记忆）
- **暗色/亮色主题** — 通过配置文件切换
- **系统托盘** — 最小化到托盘，随时一键唤起

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+F` | 唤出/隐藏编辑器（全局快捷键） |
| `Ctrl+S` | 保存笔记（窗口保持打开） |
| `Ctrl+Enter` | 保存并关闭 |
| `Ctrl+N` | 保存当前笔记并新建 |
| `Ctrl+Shift+H` | 切换全部笔记侧边栏 |
| `Ctrl+Shift+P` | 在 Markdown 编辑与预览之间切换 |
| `Ctrl+E` | 合并选中的侧边栏笔记 |
| `Ctrl+滚轮` | 缩放编辑器字体 |
| `Esc` | 自动保存并关闭 |

### Markdown 编辑器与 Mermaid 预览

源码编辑区提供 Markdown 语法高亮和完整格式工具栏。使用标题栏中的源码/眼睛按钮，或按 `Ctrl+Shift+P`，即可在 Markdown 源码与渲染结果之间切换。Mermaid 图表使用标准代码块：

````markdown
```mermaid
flowchart LR
  想法 --> 笔记
  笔记 --> 完成
```
````

### 快速开始

```bash
cd electron-app
npm install
npm run dev          # 启动开发模式（热更新）
```

### 构建安装包

```bash
cd electron-app
npm run build:win    # 生成 dist/ 目录下的 NSIS 安装包
```

### 配置

编辑 `%APPDATA%/TheFlash/config.json`：

```json
{
  "version": 1,
  "hotkey": { "modifiers": ["Ctrl", "Shift"], "key": "F" },
  "save_path": "C:\\Users\\<你>\\Documents\\TheFlash_Notes",
  "window_geometry": { "x": null, "y": null, "width": 520, "height": 400 },
  "always_on_top": false,
  "auto_save_on_close": false,
  "start_minimized_to_tray": true,
  "theme": "dark"
}
```

笔记保存为 `Documents/TheFlash_Notes/YYYY-MM-DD_HH-MM-SS.md`。

### 技术栈

- **Electron** — 主进程（窗口、托盘、全局快捷键、单实例）
- **electron-vite** + **React 18** + **TypeScript**
- **CodeMirror / react-markdown-editor** — Markdown 源码高亮与格式工具栏
- **Tailwind CSS** — 中性灰现代主题
- **electron-builder** — Windows NSIS 安装包

### 许可证

MIT
