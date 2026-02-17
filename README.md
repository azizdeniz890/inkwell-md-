<div align="center">

# 🖋️ Inkwell

**AI-powered Markdown editor for crafting beautiful GitHub README files**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![OpenAI](https://img.shields.io/badge/AI-OpenAI%20GPT--4o--mini-412991?logo=openai&logoColor=white)](https://openai.com)

[Features](#-features) • [Getting Started](#-getting-started) • [Docker](#-docker) • [Usage](#-usage) • [Contributing](#-contributing)

</div>

---

## ✨ Features

- **Live Preview** — Split-pane editor with real-time GitHub Flavored Markdown rendering
- **25+ Toolbar Actions** — Headings, formatting, code blocks, tables, badges, alerts, and more
- **AI Assistant** — Generate READMEs, improve text, summarize, create tables, and explain code using GPT-4o-mini
- **Token Tracking** — Per-request and session-wide token usage and cost display
- **Project Management** — Create, rename, delete, import/export multiple projects
- **Scroll Sync** — Editor and preview scroll together
- **Auto-Save** — Never lose your work
- **Keyboard Shortcuts** — Ctrl+B, Ctrl+I, Ctrl+K, Ctrl+S, Ctrl+1/2/3
- **Dark Theme** — Beautiful GitHub-inspired dark interface
- **Focus Mode** — Distraction-free writing

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [OpenAI API Key](https://platform.openai.com/api-keys) (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/azizdeniz890/inkwell-md-.git
cd inkwell-md-

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will open at `http://localhost:5173`

### Enter Your API Key

1. Click **Settings** in the sidebar
2. Paste your OpenAI API key
3. Click **Save**

> **Note:** Your API key is stored locally in your browser's localStorage. It is never sent anywhere except directly to OpenAI's API.

## 🐳 Docker

### Build and Run

```bash
# Build the image
docker build -t inkwell .

# Run the container
docker run -d -p 3000:80 --name inkwell inkwell
```

Open `http://localhost:3000` in your browser.

### Docker Compose (optional)

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  inkwell:
    build: .
    ports:
      - "3000:80"
    restart: unless-stopped
```

```bash
docker compose up -d
```

## 📖 Usage

### Toolbar

The toolbar provides quick access to all Markdown elements:

| Category | Actions |
|----------|---------|
| **Headings** | H1, H2, H3, H4, H5, H6 |
| **Text** | Bold, Italic, Strikethrough, Highlight, Subscript, Superscript |
| **Code** | Inline Code, Code Block |
| **Links** | Link, Image |
| **Lists** | Bullet, Numbered, Checklist |
| **Structure** | Blockquote, Table, Horizontal Rule |
| **GitHub** | Badges, Collapsible Section, Alerts, Footnotes, TOC |

### AI Assistant

Click the **AI Assistant** button to access:

- 📄 **Generate README** — Describe your project, get a complete README
- ✨ **Improve Text** — Polish and enhance your writing
- 📝 **Summarize** — Create concise summaries
- 🏷️ **Suggest Badges** — Get shields.io badge recommendations
- 📊 **Generate Table** — Create formatted tables from descriptions
- 🌍 **Translate** — Translate between English and Turkish
- 💻 **Explain Code** — Generate documentation for code snippets

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+K` | Insert Link |
| `Ctrl+S` | Save |
| `Ctrl+1/2/3` | Heading 1/2/3 |
| `Tab` | Indent |

## 🏗️ Tech Stack

- **Frontend:** Vanilla JavaScript (ES Modules)
- **Build:** [Vite](https://vitejs.dev)
- **Markdown:** [marked.js](https://marked.js.org)
- **Syntax Highlighting:** [highlight.js](https://highlightjs.org)
- **AI:** [OpenAI GPT-4o-mini](https://openai.com)
- **Deploy:** Docker + Nginx

## 🤝 Contributing

Contributions are welcome! Feel free to open issues and pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <b>Made with ❤️ by Inkwell Contributors</b>
</div>
