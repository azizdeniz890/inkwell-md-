// ===========================
// INKWELL — Main Application
// GitHub README Editor with AI
// ===========================

import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.min.css';
import { getAllProjects, createProject, updateProject, deleteProject, getSettings, saveSettings, formatDate, getActiveProjectId, setActiveProjectId } from './storage.js';
import { executeAiAction, getAiAction, AI_ACTIONS, getSessionStats } from './ai.js';

// ───── State ─────
let currentProjectId = null;
let autoSaveInterval = null;
let saveTimeout = null;

// ───── DOM Elements ─────
const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const lineNumbers = document.getElementById('line-numbers');
const projectList = document.getElementById('project-list');
const editorInfo = document.getElementById('editor-info');
const wordCount = document.getElementById('word-count');
const charCount = document.getElementById('char-count');
const lineCount = document.getElementById('line-count');
const saveStatus = document.getElementById('save-status');
const projectNameDisplay = document.getElementById('project-name-display');
const tokenCountDisplay = document.getElementById('token-count');

// ───── Configure Marked ─────
marked.setOptions({
    gfm: true,
    breaks: true,
    highlight: function (code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try { return hljs.highlight(code, { language: lang }).value; } catch { }
        }
        try { return hljs.highlightAuto(code).value; } catch { }
        return code;
    },
});

// ───── Init ─────
async function init() {
    loadSettings();
    loadLastProject();
    renderProjectList();
    updatePreview();
    updateLineNumbers();
    updateStats();
    setupEventListeners();
    startAutoSave();
    updateSessionDisplay();
}

// ───── Preview ─────
function updatePreview() {
    const content = editor.value;
    if (!content.trim()) {
        preview.innerHTML = `
      <div class="preview-placeholder">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3">
          <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <p>Start writing to see the preview...</p>
      </div>`;
        return;
    }
    try {
        preview.innerHTML = marked.parse(content);
        preview.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
        preview.querySelectorAll('a').forEach((a) => {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
        });
    } catch (e) {
        preview.innerHTML = `<p style="color: var(--red);">Render error: ${e.message}</p>`;
    }
}

// ───── Line Numbers ─────
function updateLineNumbers() {
    const lines = editor.value.split('\n').length;
    lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => `<span>${i + 1}</span>`).join('');
}

// ───── Stats ─────
function updateStats() {
    const content = editor.value;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const chars = content.length;
    const lines = content.split('\n').length;

    wordCount.textContent = `${words} words`;
    charCount.textContent = `${chars} chars`;
    lineCount.textContent = `Ln ${lines}`;
    editorInfo.textContent = `${words} words · ${chars} chars`;
}

// ───── Save Status ─────
function setSaveStatus(status) {
    const dot = saveStatus.querySelector('.status-dot');
    const text = saveStatus.querySelector('.status-dot') ? saveStatus.childNodes[saveStatus.childNodes.length - 1] : saveStatus;

    if (status === 'saved') {
        dot?.classList.remove('unsaved');
        dot?.classList.add('saved');
        saveStatus.innerHTML = `<span class="status-dot saved"></span> Saved`;
    } else if (status === 'saving') {
        dot?.classList.remove('saved', 'unsaved');
        saveStatus.innerHTML = `<span class="status-dot saving"></span> Saving...`;
    } else {
        dot?.classList.remove('saved');
        dot?.classList.add('unsaved');
        saveStatus.innerHTML = `<span class="status-dot unsaved"></span> Unsaved`;
    }
}

// ───── Projects ─────
function loadLastProject() {
    const lastId = getActiveProjectId();
    const projects = getAllProjects();

    if (lastId && projects.find(p => p.id === lastId)) {
        loadProject(lastId);
    } else if (projects.length > 0) {
        loadProject(projects[0].id);
    } else {
        const id = createProject('Untitled Project', '# My Project\n\nDescribe your project here...\n');
        loadProject(id);
    }
}

function loadProject(id) {
    const projects = getAllProjects();
    const project = projects.find(p => p.id === id);
    if (!project) return;

    currentProjectId = id;
    setActiveProjectId(id);
    editor.value = project.content || '';
    projectNameDisplay.textContent = project.name || 'Untitled Project';
    document.title = `${project.name} — Inkwell`;

    updatePreview();
    updateLineNumbers();
    updateStats();
    setSaveStatus('saved');
    renderProjectList();
}

function saveCurrentProject() {
    if (!currentProjectId) return;
    updateProject(currentProjectId, { content: editor.value });
    setSaveStatus('saved');
}

function renderProjectList() {
    const projects = getAllProjects();
    if (projects.length === 0) {
        projectList.innerHTML = '<p class="empty-hint">No projects yet</p>';
        return;
    }

    projectList.innerHTML = projects.map(p => `
    <div class="project-item ${p.id === currentProjectId ? 'active' : ''}" data-id="${p.id}">
      <div class="project-item-info">
        <span class="project-item-name">${p.name}</span>
        <span class="project-item-date">${formatDate(p.updatedAt)}</span>
      </div>
      <div class="project-item-actions">
        <button class="icon-btn-tiny" data-rename="${p.id}" title="Rename">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="icon-btn-tiny" data-delete="${p.id}" title="Delete">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

// ───── Toolbar Actions ─────
function insertText(before, after = '', placeholder = '') {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = editor.value.substring(start, end);
    const text = selected || placeholder;
    const replacement = `${before}${text}${after}`;

    editor.setRangeText(replacement, start, end, 'select');
    editor.focus();

    if (!selected && placeholder) {
        editor.selectionStart = start + before.length;
        editor.selectionEnd = start + before.length + placeholder.length;
    }

    handleEditorInput();
}

function insertAtLineStart(prefix) {
    const start = editor.selectionStart;
    const lineStart = editor.value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = editor.value.indexOf('\n', start);
    const actualEnd = lineEnd === -1 ? editor.value.length : lineEnd;
    const line = editor.value.substring(lineStart, actualEnd);

    if (line.startsWith(prefix)) {
        editor.setRangeText(line.substring(prefix.length), lineStart, actualEnd, 'end');
    } else {
        editor.setRangeText(prefix + line, lineStart, actualEnd, 'end');
    }

    editor.focus();
    handleEditorInput();
}

function insertBlock(text) {
    const start = editor.selectionStart;
    const before = editor.value.substring(0, start);
    const needsNewline = before.length > 0 && !before.endsWith('\n\n');
    const prefix = needsNewline ? (before.endsWith('\n') ? '\n' : '\n\n') : '';

    editor.setRangeText(prefix + text + '\n', start, editor.selectionEnd, 'end');
    editor.focus();
    handleEditorInput();
}

const toolbarActions = {
    'h1': () => insertAtLineStart('# '),
    'h2': () => insertAtLineStart('## '),
    'h3': () => insertAtLineStart('### '),
    'h4': () => insertAtLineStart('#### '),
    'h5': () => insertAtLineStart('##### '),
    'h6': () => insertAtLineStart('###### '),
    'bold': () => insertText('**', '**', 'bold text'),
    'italic': () => insertText('*', '*', 'italic text'),
    'strikethrough': () => insertText('~~', '~~', 'strikethrough'),
    'highlight': () => insertText('==', '==', 'highlighted text'),
    'subscript': () => insertText('<sub>', '</sub>', 'subscript'),
    'superscript': () => insertText('<sup>', '</sup>', 'superscript'),
    'code-inline': () => insertText('`', '`', 'code'),
    'code-block': () => insertBlock('```javascript\n// your code here\n```'),
    'link': () => insertText('[', '](https://)', 'link text'),
    'image': () => insertText('![', '](https://image-url)', 'alt text'),
    'ul': () => insertAtLineStart('- '),
    'ol': () => insertAtLineStart('1. '),
    'checklist': () => insertBlock('- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3'),
    'quote': () => insertAtLineStart('> '),
    'table': () => insertBlock('| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |'),
    'hr': () => insertBlock('---'),
    'badge': () => insertText('![', '](https://img.shields.io/badge/label-message-color)', 'Badge'),
    'details': () => insertBlock('<details>\n<summary>Click to expand</summary>\n\nHidden content goes here...\n\n</details>'),
    'alert-note': () => insertBlock('> [!NOTE]\n> Useful information that users should know.'),
    'alert-warning': () => insertBlock('> [!WARNING]\n> Critical content demanding immediate attention.'),
    'footnote': () => insertText('[^', ']', '1'),
    'toc': () => insertBlock('## Table of Contents\n\n- [Introduction](#introduction)\n- [Features](#features)\n- [Installation](#installation)\n- [Usage](#usage)\n- [Contributing](#contributing)\n- [License](#license)'),
};

// ───── Editor Input Handler ─────
function handleEditorInput() {
    updatePreview();
    updateLineNumbers();
    updateStats();
    setSaveStatus('unsaved');

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveCurrentProject();
    }, 2000);
}

// ───── Auto-Save ─────
function startAutoSave() {
    const settings = getSettings();
    if (settings.autoSave) {
        autoSaveInterval = setInterval(() => {
            if (currentProjectId) {
                saveCurrentProject();
            }
        }, 30000);
    }
}

// ───── Settings ─────
function loadSettings() {
    const settings = getSettings();
    editor.style.fontSize = `${settings.fontSize}px`;
}

// ───── AI Session Display ─────
function updateSessionDisplay() {
    const stats = getSessionStats();
    tokenCountDisplay.textContent = `${stats.tokens.total} tokens`;

    const sessionTokensEl = document.getElementById('ai-session-tokens');
    const sessionCostEl = document.getElementById('ai-session-cost');
    if (sessionTokensEl) sessionTokensEl.textContent = `${stats.tokens.total} tokens`;
    if (sessionCostEl) sessionCostEl.textContent = `$${stats.cost.toFixed(4)}`;
}

// ───── Toast ─────
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('toast-show'), 10);
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ───── Event Listeners ─────
function setupEventListeners() {
    // Editor input
    editor.addEventListener('input', handleEditorInput);

    // Scroll sync: editor → line numbers + preview
    let isEditorScrolling = false;
    let isPreviewScrolling = false;

    editor.addEventListener('scroll', () => {
        lineNumbers.scrollTop = editor.scrollTop;

        if (isPreviewScrolling) return;
        isEditorScrolling = true;
        const scrollPercent = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
        preview.scrollTop = scrollPercent * (preview.scrollHeight - preview.clientHeight);
        requestAnimationFrame(() => { isEditorScrolling = false; });
    });

    preview.addEventListener('scroll', () => {
        if (isEditorScrolling) return;
        isPreviewScrolling = true;
        const scrollPercent = preview.scrollTop / (preview.scrollHeight - preview.clientHeight || 1);
        editor.scrollTop = scrollPercent * (editor.scrollHeight - editor.clientHeight);
        lineNumbers.scrollTop = editor.scrollTop;
        requestAnimationFrame(() => { isPreviewScrolling = false; });
    });

    // Editor keyboard shortcuts
    editor.addEventListener('keydown', (e) => {
        // Tab indent
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = editor.selectionStart;
            editor.setRangeText('  ', start, start, 'end');
            handleEditorInput();
            return;
        }

        // Auto-continue lists
        if (e.key === 'Enter') {
            const start = editor.selectionStart;
            const currentLine = editor.value.substring(
                editor.value.lastIndexOf('\n', start - 1) + 1,
                start
            );

            // Checklist continuation
            const checkMatch = currentLine.match(/^(\s*)- \[([ xX])\] /);
            if (checkMatch) {
                e.preventDefault();
                const indent = checkMatch[1];
                if (currentLine.trim() === '- [ ]' || currentLine.trim() === '- [x]') {
                    const lineStart = editor.value.lastIndexOf('\n', start - 1) + 1;
                    editor.setRangeText('\n', lineStart, start, 'end');
                } else {
                    editor.setRangeText(`\n${indent}- [ ] `, start, start, 'end');
                }
                handleEditorInput();
                return;
            }

            // Unordered list continuation
            const ulMatch = currentLine.match(/^(\s*)([*+-]) /);
            if (ulMatch) {
                e.preventDefault();
                const [, indent, marker] = ulMatch;
                if (currentLine.trim() === marker) {
                    const lineStart = editor.value.lastIndexOf('\n', start - 1) + 1;
                    editor.setRangeText('\n', lineStart, start, 'end');
                } else {
                    editor.setRangeText(`\n${indent}${marker} `, start, start, 'end');
                }
                handleEditorInput();
                return;
            }

            // Ordered list continuation
            const olMatch = currentLine.match(/^(\s*)(\d+)\. /);
            if (olMatch) {
                e.preventDefault();
                const [, indent, num] = olMatch;
                if (currentLine.trim() === `${num}.`) {
                    const lineStart = editor.value.lastIndexOf('\n', start - 1) + 1;
                    editor.setRangeText('\n', lineStart, start, 'end');
                } else {
                    editor.setRangeText(`\n${indent}${parseInt(num) + 1}. `, start, start, 'end');
                }
                handleEditorInput();
                return;
            }
        }

        // Keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'b': e.preventDefault(); toolbarActions.bold(); break;
                case 'i': e.preventDefault(); toolbarActions.italic(); break;
                case 'k': e.preventDefault(); toolbarActions.link(); break;
                case 's': e.preventDefault(); saveCurrentProject(); showToast('Saved', 'success'); break;
                case '1': e.preventDefault(); toolbarActions.h1(); break;
                case '2': e.preventDefault(); toolbarActions.h2(); break;
                case '3': e.preventDefault(); toolbarActions.h3(); break;
            }
        }
    });

    // Toolbar buttons
    document.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            if (toolbarActions[action]) toolbarActions[action]();
        });
    });

    // Sidebar toggle
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    document.getElementById('sidebar-toggle-btn')?.addEventListener('click', () => {
        sidebar.classList.add('sidebar-hidden');
        mainContent.classList.add('sidebar-collapsed');
        document.getElementById('sidebar-open-btn')?.classList.remove('hidden');
    });
    document.getElementById('sidebar-open-btn')?.addEventListener('click', () => {
        sidebar.classList.remove('sidebar-hidden');
        mainContent.classList.remove('sidebar-collapsed');
        document.getElementById('sidebar-open-btn')?.classList.add('hidden');
    });

    // New project
    document.getElementById('new-project-btn')?.addEventListener('click', () => {
        const id = createProject('Untitled Project', '# New Project\n\nStart writing here...\n');
        loadProject(id);
        showToast('New project created', 'success');
    });

    // Project list events (delegation)
    projectList.addEventListener('click', (e) => {
        const item = e.target.closest('[data-id]');
        const renameBtn = e.target.closest('[data-rename]');
        const deleteBtn = e.target.closest('[data-delete]');

        if (deleteBtn) {
            const id = deleteBtn.dataset.delete;
            const projects = getAllProjects();
            const project = projects.find(p => p.id === id);
            if (confirm(`Delete "${project?.name}"?`)) {
                deleteProject(id);
                if (id === currentProjectId) {
                    const remaining = getAllProjects();
                    if (remaining.length > 0) {
                        loadProject(remaining[0].id);
                    } else {
                        const newId = createProject('Untitled Project', '');
                        loadProject(newId);
                    }
                }
                renderProjectList();
                showToast('Project deleted', 'info');
            }
            return;
        }

        if (renameBtn) {
            const id = renameBtn.dataset.rename;
            const projects = getAllProjects();
            const project = projects.find(p => p.id === id);
            const modal = document.getElementById('rename-modal');
            const input = document.getElementById('rename-input');
            input.value = project?.name || '';
            modal.classList.add('active');
            input.focus();
            input.select();

            document.getElementById('rename-save-btn').onclick = () => {
                if (input.value.trim()) {
                    updateProject(id, { name: input.value.trim() });
                    if (id === currentProjectId) {
                        projectNameDisplay.textContent = input.value.trim();
                        document.title = `${input.value.trim()} — Inkwell`;
                    }
                    renderProjectList();
                    modal.classList.remove('active');
                    showToast('Project renamed', 'success');
                }
            };
            return;
        }

        if (item) {
            saveCurrentProject();
            loadProject(item.dataset.id);
        }
    });

    // Copy button
    document.getElementById('copy-btn')?.addEventListener('click', () => {
        navigator.clipboard.writeText(editor.value).then(() => {
            showToast('Markdown copied to clipboard', 'success');
        });
    });

    // Download button
    document.getElementById('download-btn')?.addEventListener('click', () => {
        const projects = getAllProjects();
        const project = projects.find(p => p.id === currentProjectId);
        const filename = (project?.name || 'README').replace(/[^a-zA-Z0-9-_]/g, '_') + '.md';
        const blob = new Blob([editor.value], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Downloaded ${filename}`, 'success');
    });

    // Import button
    document.getElementById('import-btn')?.addEventListener('click', () => {
        document.getElementById('file-input').click();
    });

    document.getElementById('file-input')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const name = file.name.replace(/\.(md|markdown|txt)$/, '');
            const id = createProject(name, ev.target.result);
            loadProject(id);
            showToast(`Imported "${name}"`, 'success');
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    // Fullscreen toggle
    document.getElementById('fullscreen-btn')?.addEventListener('click', () => {
        const editorPane = document.getElementById('editor-pane');
        const previewPane = document.getElementById('preview-pane');
        editorPane.classList.toggle('focus-mode');
        previewPane.classList.toggle('focus-mode-hidden');
        document.getElementById('resizer')?.classList.toggle('hidden');
    });

    // Resizer
    const resizer = document.getElementById('resizer');
    let isResizing = false;
    resizer?.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const editorArea = document.querySelector('.editor-area');
        const rect = editorArea.getBoundingClientRect();
        const percent = ((e.clientX - rect.left) / rect.width) * 100;
        const clamped = Math.min(Math.max(percent, 20), 80);
        document.getElementById('editor-pane').style.width = `${clamped}%`;
        document.getElementById('preview-pane').style.width = `${100 - clamped}%`;
    });
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });

    // Settings modal
    document.getElementById('settings-btn')?.addEventListener('click', () => {
        const modal = document.getElementById('settings-modal');
        const settings = getSettings();
        document.getElementById('api-key-input').value = settings.apiKey || '';
        document.getElementById('auto-save-toggle').checked = settings.autoSave;
        document.getElementById('font-size-select').value = settings.fontSize;
        modal.classList.add('active');
    });

    document.getElementById('save-settings-btn')?.addEventListener('click', () => {
        const apiKey = document.getElementById('api-key-input').value.trim();
        const autoSave = document.getElementById('auto-save-toggle').checked;
        const fontSize = parseInt(document.getElementById('font-size-select').value);
        saveSettings({ apiKey, autoSave, fontSize });
        loadSettings();
        clearInterval(autoSaveInterval);
        startAutoSave();
        document.getElementById('settings-modal').classList.remove('active');
        showToast('Settings saved', 'success');
    });

    document.getElementById('toggle-key-visibility')?.addEventListener('click', () => {
        const input = document.getElementById('api-key-input');
        input.type = input.type === 'password' ? 'text' : 'password';
    });

    // AI dropdown
    const aiBtn = document.getElementById('ai-btn');
    const aiMenu = document.getElementById('ai-menu');

    aiBtn?.addEventListener('click', () => {
        aiMenu.classList.toggle('active');
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#ai-dropdown')) {
            aiMenu?.classList.remove('active');
        }
    });

    // AI menu items
    document.querySelectorAll('[data-ai]').forEach(btn => {
        btn.addEventListener('click', () => {
            const actionId = btn.dataset.ai;
            openAiModal(actionId);
            aiMenu.classList.remove('active');
        });
    });

    // AI modal submit
    document.getElementById('ai-submit-btn')?.addEventListener('click', handleAiSubmit);

    // AI result actions
    document.getElementById('ai-copy-result-btn')?.addEventListener('click', () => {
        const resultText = document.getElementById('ai-result-text').textContent;
        navigator.clipboard.writeText(resultText).then(() => {
            showToast('Result copied to clipboard', 'success');
        });
    });

    document.getElementById('ai-insert-btn')?.addEventListener('click', () => {
        const resultText = document.getElementById('ai-result-text').textContent;
        const start = editor.selectionStart;
        const before = editor.value.substring(0, start);
        const needsNewline = before.length > 0 && !before.endsWith('\n');
        const prefix = needsNewline ? '\n\n' : '';
        editor.setRangeText(prefix + resultText, start, editor.selectionEnd, 'end');
        handleEditorInput();
        document.getElementById('ai-modal').classList.remove('active');
        showToast('Inserted into editor', 'success');
    });

    // Modal close buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.close;
            document.getElementById(modalId)?.classList.remove('active');
        });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    });

    // Save on unload
    window.addEventListener('beforeunload', () => {
        saveCurrentProject();
    });
}

// ───── AI Modal ─────
let currentAiAction = null;

function openAiModal(actionId) {
    const action = getAiAction(actionId);
    if (!action) return;

    currentAiAction = actionId;
    const modal = document.getElementById('ai-modal');
    document.getElementById('ai-modal-title').textContent = action.title;
    document.getElementById('ai-input-label').textContent = action.label;
    document.getElementById('ai-input').placeholder = action.placeholder;
    document.getElementById('ai-input').value = '';

    // Auto-fill with selected text
    const selected = editor.value.substring(editor.selectionStart, editor.selectionEnd);
    if (selected.trim()) {
        document.getElementById('ai-input').value = selected;
    }

    // Reset result
    document.getElementById('ai-loading').classList.add('hidden');
    document.getElementById('ai-result').classList.add('hidden');
    document.getElementById('ai-submit-btn').disabled = false;

    // Update session stats
    updateSessionDisplay();

    modal.classList.add('active');
    document.getElementById('ai-input').focus();
}

async function handleAiSubmit() {
    const input = document.getElementById('ai-input').value.trim();
    if (!input || !currentAiAction) return;

    const loadingEl = document.getElementById('ai-loading');
    const resultEl = document.getElementById('ai-result');
    const submitBtn = document.getElementById('ai-submit-btn');

    loadingEl.classList.remove('hidden');
    resultEl.classList.add('hidden');
    submitBtn.disabled = true;

    try {
        const result = await executeAiAction(currentAiAction, input);

        document.getElementById('ai-result-text').textContent = result.text;
        document.getElementById('ai-result-tokens').textContent = `${result.usage.totalTokens} tokens`;
        document.getElementById('ai-result-cost').textContent = `$${result.usage.cost.toFixed(4)}`;

        resultEl.classList.remove('hidden');
        updateSessionDisplay();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        loadingEl.classList.add('hidden');
        submitBtn.disabled = false;
    }
}

// ───── Start ─────
init();
