# PensLE MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-ready PensLE app with recording, AI-assisted note creation, local persistence, note browsing, connection visualization, settings, and light/dark theme support.

**Architecture:** Create a Vite React + TypeScript app. Keep business logic in tested services so browser fallback storage can later be replaced by Capacitor SQLite and Filesystem. UI pages consume hooks/services rather than browser APIs directly.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, React Router, Lucide React, react-markdown, remark-gfm, react-force-graph-2d, browser MediaRecorder, localStorage.

---

### Task 1: Scaffold App And Tests

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Create Vite React project files**

Create the package, Vite, and TypeScript configuration for a React app with Vitest.

- [ ] **Step 2: Install dependencies**

Run: `npm install`

Expected: dependencies install without package resolution errors.

### Task 2: Define Domain Types And Services

**Files:**
- Create: `src/types/index.ts`
- Create: `src/services/markdownService.ts`
- Create: `src/services/aiService.ts`
- Create: `src/services/graphService.ts`
- Create: `src/services/storageService.ts`
- Test: `src/services/*.test.ts`

- [ ] **Step 1: Write failing service tests**

Tests must cover Markdown comparison sections, AI parse/connection validation, graph mapping, and local storage persistence.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- --run`

Expected: service tests fail because service modules do not exist yet.

- [ ] **Step 3: Implement service code**

Implement types and services with browser storage fallback.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test -- --run`

Expected: service tests pass.

### Task 3: Build App UI

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`
- Create: `src/hooks/useRecorder.ts`
- Create: `src/services/audioService.ts`
- Create: `src/services/transcriptionService.ts`
- Create: `src/pages/CapturePage.tsx`
- Create: `src/pages/NotesPage.tsx`
- Create: `src/pages/NotePage.tsx`
- Create: `src/pages/ConnectionsPage.tsx`
- Create: `src/pages/SettingsPage.tsx`
- Create: `src/components/AppShell.tsx`
- Create: `src/components/TagChip.tsx`
- Create: `src/components/ThemeProvider.tsx`
- Create: `src/data/sampleNotes.ts`

- [ ] **Step 1: Implement recorder, pages, and shell**

Build the mobile-first app using visible labels "Capturar", "Notas", "Conexoes", and "Ajustes".

- [ ] **Step 2: Connect UI to services**

Wire recording, fallback note creation, search/filter, markdown rendering, graph data, settings, and theme switching.

### Task 4: Capacitor-Ready Metadata And Docs

**Files:**
- Create: `capacitor.config.ts`
- Create: `README.md`

- [ ] **Step 1: Add Capacitor config**

Set `appId` to `com.otgan.pensle` and `appName` to `PensLE`.

- [ ] **Step 2: Write README**

Document browser usage, Groq key setup, build command, and Capacitor-ready next steps.

### Task 5: Verify

**Files:**
- No new files.

- [ ] **Step 1: Run tests**

Run: `npm test -- --run`

Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: TypeScript and Vite build succeed.

- [ ] **Step 3: Start dev server**

Run: `npm run dev -- --host 127.0.0.1`

Expected: local URL is available.

- [ ] **Step 4: Inspect in browser**

Open the app, verify the main pages render, theme switching works, and the note comparison section is visible.
