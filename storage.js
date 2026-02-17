// ===========================
// STORAGE MODULE
// Project memory system using localStorage
// ===========================

const STORAGE_KEY = 'inkwell_projects';
const SETTINGS_KEY = 'inkwell_settings';
const ACTIVE_PROJECT_KEY = 'inkwell_active_project';

// Migrate old data
(function migrate() {
    const oldProjects = localStorage.getItem('markcraft_projects');
    if (oldProjects && !localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, oldProjects);
    }
    const oldActive = localStorage.getItem('markcraft_active_project');
    if (oldActive && !localStorage.getItem(ACTIVE_PROJECT_KEY)) {
        localStorage.setItem(ACTIVE_PROJECT_KEY, oldActive);
    }
    // Clear old settings (force new API key)
    localStorage.removeItem('markcraft_settings');
})();

// Default settings
const DEFAULT_SETTINGS = {
    apiKey: '',
    autoSave: true,
    fontSize: 14,
};

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Format date (English)
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
}

// ===========================
// PROJECTS
// ===========================

function getAllProjects() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveAllProjects(projects) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function createProject(name = 'Untitled Project', content = '') {
    const projects = getAllProjects();
    const project = {
        id: generateId(),
        name,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    projects.unshift(project);
    saveAllProjects(projects);
    setActiveProjectId(project.id);
    return project.id;
}

function getProject(id) {
    const projects = getAllProjects();
    return projects.find(p => p.id === id) || null;
}

function updateProject(id, updates) {
    const projects = getAllProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return null;

    projects[index] = {
        ...projects[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    saveAllProjects(projects);
    return projects[index];
}

function deleteProject(id) {
    let projects = getAllProjects();
    projects = projects.filter(p => p.id !== id);
    saveAllProjects(projects);

    if (getActiveProjectId() === id) {
        setActiveProjectId(null);
    }
}

function getActiveProjectId() {
    return localStorage.getItem(ACTIVE_PROJECT_KEY);
}

function setActiveProjectId(id) {
    if (id) {
        localStorage.setItem(ACTIVE_PROJECT_KEY, id);
    } else {
        localStorage.removeItem(ACTIVE_PROJECT_KEY);
    }
}

// ===========================
// SETTINGS
// ===========================

function getSettings() {
    try {
        const data = localStorage.getItem(SETTINGS_KEY);
        return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : { ...DEFAULT_SETTINGS };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ===========================
// EXPORTS
// ===========================

export {
    generateId,
    formatDate,
    getAllProjects,
    createProject,
    getProject,
    updateProject,
    deleteProject,
    getActiveProjectId,
    setActiveProjectId,
    getSettings,
    saveSettings,
    DEFAULT_SETTINGS,
};
