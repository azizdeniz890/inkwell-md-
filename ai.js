// ===========================
// AI MODULE
// OpenAI GPT-4o-mini Integration with Token Tracking
// ===========================

import { getSettings } from './storage.js';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

// Pricing per 1M tokens (GPT-4o-mini)
const PRICING = {
    input: 0.15,   // $0.15 / 1M input tokens
    output: 0.60,  // $0.60 / 1M output tokens
};

// Session-level token tracker
let sessionTokens = { input: 0, output: 0, total: 0 };
let sessionCost = 0;

// AI action configurations
const AI_ACTIONS = {
    'generate-readme': {
        title: 'Generate README',
        label: 'Describe your project (name, tech stack, features)',
        placeholder: 'e.g. "TodoApp — a task management app built with React & Firebase. Features: auth, CRUD tasks, categories, dark mode."',
        systemPrompt: 'You are a GitHub README expert. Create professional README.md files with badges (shields.io), emojis, and clear sections. Use GitHub Flavored Markdown. Return ONLY markdown.',
        buildPrompt: (input) => `Create a complete README.md for:\n\n${input}\n\nInclude: title, badges, description, features, tech stack, getting started, usage, contributing, license.`,
    },

    'improve-text': {
        title: 'Improve Text',
        label: 'Paste the text you want to improve',
        placeholder: 'Paste markdown text here...',
        systemPrompt: 'Improve markdown text to be more professional, clear, and well-structured. Fix grammar, enhance wording. Return ONLY improved markdown.',
        buildPrompt: (input) => `Improve this markdown:\n\n${input}`,
    },

    'summarize': {
        title: 'Summarize',
        label: 'Paste the text to summarize',
        placeholder: 'Paste long text here...',
        systemPrompt: 'Create concise markdown summaries with bullet points. Return ONLY the summary.',
        buildPrompt: (input) => `Summarize:\n\n${input}`,
    },

    'suggest-badges': {
        title: 'Suggest Badges',
        label: 'Describe your project (tech, license, etc.)',
        placeholder: 'e.g. "React, TypeScript, MIT license, npm package, has CI/CD"',
        systemPrompt: 'Suggest shields.io badges in markdown. Return ONLY badge markdown code.',
        buildPrompt: (input) => `Suggest shields.io badges for: ${input}`,
    },

    'generate-table': {
        title: 'Generate Table',
        label: 'Describe the table you need',
        placeholder: 'e.g. "3 columns: Command, Description, Example. 5 rows for git commands."',
        systemPrompt: 'Create properly formatted markdown tables. Return ONLY the table.',
        buildPrompt: (input) => `Create a markdown table: ${input}`,
    },

    'translate': {
        title: 'Translate (EN↔TR)',
        label: 'Paste the text to translate',
        placeholder: 'Paste text here... (auto-detects language direction)',
        systemPrompt: 'Translate markdown between Turkish and English. Preserve all formatting. Return ONLY translated text.',
        buildPrompt: (input) => `Translate (TR↔EN), preserve markdown formatting:\n\n${input}`,
    },

    'explain-code': {
        title: 'Explain Code',
        label: 'Paste the code to explain',
        placeholder: 'Paste code here...',
        systemPrompt: 'Explain code and create markdown documentation. Include description, parameters, return values, and usage example. Return ONLY markdown.',
        buildPrompt: (input) => `Explain this code:\n\n\`\`\`\n${input}\n\`\`\``,
    },
};

/**
 * Calculate cost from token counts
 */
function calculateCost(inputTokens, outputTokens) {
    return (inputTokens * PRICING.input / 1_000_000) + (outputTokens * PRICING.output / 1_000_000);
}

/**
 * Get session stats
 */
function getSessionStats() {
    return {
        tokens: sessionTokens,
        cost: sessionCost,
    };
}

/**
 * Call OpenAI API with token tracking
 */
async function callOpenAI(systemPrompt, userPrompt) {
    const settings = getSettings();
    const apiKey = settings.apiKey;

    if (!apiKey) {
        throw new Error('API key not found. Please enter your OpenAI API key in Settings.');
    }

    const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 2048,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        if (response.status === 401) {
            throw new Error('Invalid API key. Please check your key in Settings.');
        }
        if (response.status === 402 || response.status === 403) {
            throw new Error('Insufficient API balance or access denied.');
        }
        throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
        throw new Error('Empty response from OpenAI.');
    }

    // Track tokens
    const usage = data.usage || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || 0;
    const requestCost = calculateCost(inputTokens, outputTokens);

    sessionTokens.input += inputTokens;
    sessionTokens.output += outputTokens;
    sessionTokens.total += totalTokens;
    sessionCost += requestCost;

    return {
        text: text.trim(),
        usage: {
            inputTokens,
            outputTokens,
            totalTokens,
            cost: requestCost,
        },
        session: getSessionStats(),
    };
}

/**
 * Execute an AI action
 */
async function executeAiAction(actionId, userInput) {
    const action = AI_ACTIONS[actionId];
    if (!action) {
        throw new Error('Unknown AI action.');
    }

    const userPrompt = action.buildPrompt(userInput);
    return await callOpenAI(action.systemPrompt, userPrompt);
}

/**
 * Get action configuration
 */
function getAiAction(actionId) {
    return AI_ACTIONS[actionId] || null;
}

export { executeAiAction, getAiAction, AI_ACTIONS, getSessionStats };
