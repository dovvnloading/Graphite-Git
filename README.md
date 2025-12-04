
# Graphite:Git

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Framework: React](https://img.shields.io/badge/Framework-React-61DAFB?logo=react)](https://reactjs.org/)
[![Language: TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Powered by: Vite](https://img.shields.io/badge/Powered%20by-Vite-646CFF?logo=vite)](https://vitejs.dev/)
[![AI Engine: Gemini](https://img.shields.io/badge/AI%20Engine-Gemini-8E75B9?logo=google-gemini)](https://ai.google.dev/)

</div>

<div align="center">
  <p><strong>A secure, local-first GitHub client with an integrated AI engineering agent. Manage repositories, edit code, and interact with your entire GitHub presence from a single, sophisticated interface.</strong></p>
</div>

<details>
<summary align="center"><strong>View Application Screenshots</strong></summary>
<br/>
<img width="1920" height="1032" alt="Application Screenshot" src="https://github.com/user-attachments/assets/c62a3b4c-e9e9-4957-9cc6-a4cf1b74326b" />
<img width="1920" height="1032" alt="Application Screenshot" src="https://github.com/user-attachments/assets/5245bcf7-06f7-49d8-b09f-439307868ad4" />
<img width="1920" height="1032" alt="Application Screenshot" src="https://github.com/user-attachments/assets/a217964f-6b44-4473-9636-9d418586d1b2" />
<img width="1920" height="1032" alt="Application Screenshot" src="https://github.com/user-attachments/assets/1dc66c80-830a-4664-a500-8c526bdc31b8" />
<img width="1920" height="1032" alt="Application Screenshot" src="https://github.com/user-attachments/assets/8d7d5417-ff27-4a3a-b999-1bf3f267708a" />
<img width="1589" height="842" alt="Application Screenshot" src="https://github.com/user-attachments/assets/21393c4d-f5ff-4ad5-bccd-a202c338db98" />
</details>

---

## Overview

**Graphite:Git** is a high-performance, browser-based GitHub management tool designed for developers who demand security, efficiency, and advanced capabilities. It operates entirely on the client side, meaning your GitHub token and API keys never leave your browser.

From a feature-rich dashboard and a complete in-browser IDE to an AI agent that can read, write, and refactor your code, Graphite provides a comprehensive toolkit for modern software development.

## Core Features

*   **Secure & Local-First:** Your GitHub token is stored exclusively in `localStorage`. All API communication happens directly between your browser and GitHub/Google. No intermediary servers, no tracking.
*   **Integrated AI Agent:** Leverage the power of Google's Gemini models to interact with your code. The agent can list files, read content, create new files, or apply targeted refactors, all with your explicit approval for every action.
*   **Full-Featured Code Editor:** Browse repository file structures, view images, and edit code with syntax highlighting directly in the browser. Preview Markdown and sandboxed HTML files instantly.
*   **Comprehensive Management:**
    *   **Dashboard:** Visualize your contribution history with multiple themes, track key statistics, and analyze your language distribution.
    *   **Repository Manager:** Search, filter, edit metadata, and manage all your repositories.
    *   **Profile Editor:** Update your GitHub profile with a live preview.
    *   **Gist Manager:** Create, edit, and delete public or secret gists with a multi-file editor.
*   **Productivity Tools:**
    *   **Focus Board:** A unified inbox for all issues and pull requests where you are assigned or mentioned.
    *   **Workflow Monitor:** View and manually trigger GitHub Actions workflows across your repositories.
    *   **Network Manager:** Audit your followers/following list to find non-reciprocal follows and protect important contacts with a "Safety Net" whitelist.

## Technology Stack

Graphite is built with a modern, performant, and type-safe technology stack:

*   **Frontend:** React 18, TypeScript, Vite
*   **API Interaction:** Direct integration with GitHub REST/GraphQL APIs and Google GenAI API.
*   **State Management:** React Context API for global state.
*   **Styling:** Tailwind CSS with a custom design system.
*   **Core Dependencies:** `@google/genai`, `react-syntax-highlighter`, `lucide-react`, `react-markdown`.

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (version 18.0.0 or higher recommended)
*   A package manager like `npm` or `yarn`

### Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/dovvnloading/graphite-git.git
    cd graphite-git
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure API Keys**
    Graphite requires two keys to function:

    *   **GitHub Personal Access Token:**
        *   Generate a token [here](https://github.com/settings/tokens).
        *   Required scopes: `repo`, `user`, `gist`, `notifications`, `workflow`, `delete_repo`.
        *   This token will be entered directly into the application's login screen (`TokenGate`) and stored in your browser's `localStorage`. **It is not committed to the repository.**

    *   **Google Gemini API Key:**
        *   Obtain a key from [Google AI Studio](https://ai.studio.google.com/app/apikey).
        *   After logging into the app, navigate to **Settings > Intelligence Engine** and enter your Gemini API key. This is also stored securely in `localStorage`.

4.  **Run the Development Server**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or the next available port).

## Architectural Overview

The application is architected with a strong separation of concerns:

*   **`src/services`**: Contains `githubService.ts` and `geminiService.ts`. These classes encapsulate all logic for communicating with external APIs, providing a clean, reusable interface for the rest of the application.
*   **`src/components`**: Houses all React components. This includes both high-level "view" components (like `Dashboard.tsx`, `RepoManager.tsx`) and the core `AgentProvider.tsx`, which manages all AI-related state via React Context.
*   **`src/types.ts`**: A central file defining all TypeScript interfaces for GitHub API objects and internal application state, ensuring type safety and code clarity throughout the project.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE.md) file for details.
