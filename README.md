# DevDesk

### Your entire developer workflow. One workspace.

DevDesk is an all-in-one developer productivity workspace designed to help developers organize code snippets, technical notes, projects, debugging records, commands, developer utilities, and learning resources in one unified environment.

Instead of switching between multiple tools, DevDesk brings essential developer workflows together in a clean, modern, and productivity-focused workspace.

---

## Overview

DevDesk is designed for students, programmers, software developers, freelancers, and technology enthusiasts who want a better way to manage their daily development activities.

The platform combines a personal code library, technical knowledge base, developer tools, project management, debugging records, and productivity features into a single workspace.

DevDesk focuses on simplicity, organization, accessibility, privacy, and productivity.

---

## Features

### Code Vault

- Store and organize reusable code snippets.
- Support multiple programming languages.
- Syntax-highlighted code editor.
- Search snippets by title, language, tags, or content.
- Copy, edit, delete, and duplicate snippets.
- Organize snippets using folders and collections.
- Save favorite and pinned snippets.

### DevNotes

- Create and manage technical notes.
- Markdown editor with preview.
- Organize notes using folders and tags.
- Save programming concepts, tutorials, and study materials.
- Pin important notes.
- Search through saved knowledge.

### API Studio

- Test HTTP API endpoints.
- Support GET, POST, PUT, PATCH, and DELETE requests.
- Manage headers and query parameters.
- Send JSON request bodies.
- View API responses and status codes.
- Organize and save API requests.

### Data Lab

A collection of useful developer utilities:

- JSON Formatter & Validator
- Base64 Encoder & Decoder
- URL Encoder & Decoder
- UUID Generator
- Hash Generator
- Regex Tester
- Timestamp Converter
- HEX, RGB & HSL Converter
- Text Diff Checker
- SQL Formatter
- XML Formatter
- HTML Entity Converter
- Markdown Preview
- QR Code Generator
- Word & Character Counter
- Number Base Converter
- JWT Decoder
- Simple Calculator
- Color Palette Generator

### Error Archive

- Save programming errors and debugging records.
- Store error messages and their context.
- Document root causes.
- Save troubleshooting steps.
- Keep original and corrected code.
- Organize errors using tags and programming languages.

### Project Hub

- Create and manage development projects.
- Organize project tasks.
- Track project progress.
- Manage task priorities and statuses.
- Organize tasks using To Do, In Progress, and Done.
- Store project descriptions, technology stacks, and related resources.

### Command Library

- Store commonly used developer commands.
- Organize commands by category.
- Git and GitHub CLI references.
- Windows CMD and PowerShell commands.
- Linux commands.
- npm, pnpm, and pip commands.
- Docker, SQL, Python, and C/C++ commands.
- Save custom commands.
- Copy commands quickly.

### Dev AI

An optional AI-powered development assistant designed to help with:

- Code explanations.
- Debugging assistance.
- Code improvement suggestions.
- Documentation generation.
- SQL explanations.
- Regex generation.
- Technical note summaries.

AI features will respect user privacy and will not silently send private code or personal data to AI providers.

### Focus Timer

- Pomodoro timer.
- 25/5 and 50/10 focus presets.
- Custom timer sessions.
- Start, pause, resume, and reset.
- Focus session tracking.

### Bookmarks

- Save useful development websites.
- Organize documentation and tutorials.
- Add categories and tags.
- Keep frequently used resources accessible.

### Dev Analytics

- Track saved snippets and notes.
- Monitor project progress.
- View focus sessions.
- Explore weekly and monthly productivity activity.

### Universal Search

Search across your workspace:

- Code snippets
- Technical notes
- Projects
- Tasks
- Errors
- Commands
- Bookmarks
- Developer tools

---

## Screenshots

> Screenshots of the actual application will be added here as the development progresses.

| Dashboard   | Code Vault  |
| ----------- | ----------- |
| Coming Soon | Coming Soon |

| DevNotes    | Data Lab    |
| ----------- | ----------- |
| Coming Soon | Coming Soon |

---

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Responsive UI components

### Backend & Database

- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Storage
- Row Level Security (RLS)

### Desktop

- Tauri
- Windows Desktop Integration

### Mobile

- Progressive Web App (PWA)
- Capacitor for a potential Android APK build

### Local Storage & Offline Support

- IndexedDB
- Local caching
- Offline data access
- Synchronization queue

---

## Platform Support

| Platform                  | Status                         |
| ------------------------- | ------------------------------ |
| Web Application           | Development                    |
| Responsive Mobile Web     | Planned / In Development       |
| Progressive Web App (PWA) | Planned                        |
| Windows Desktop           | Planned – Tauri                |
| Android APK               | Planned – Capacitor            |
| iOS                       | Responsive Web / PWA initially |

Only officially built and tested applications will be published for download.

---

## Architecture

DevDesk follows a modular architecture designed to keep features independent, maintainable, and scalable.

```text
DevDesk
│
├── Web Application
│   ├── Dashboard
│   ├── Code Vault
│   ├── DevNotes
│   ├── API Studio
│   ├── Data Lab
│   ├── Error Archive
│   ├── Project Hub
│   ├── Command Library
│   ├── Dev AI
│   ├── Dev Analytics
│   └── Bookmarks
│
├── Shared Core
│   ├── UI Components
│   ├── Design System
│   ├── Types
│   ├── Utilities
│   └── Platform Adapters
│
├── Backend
│   ├── Authentication
│   ├── Database
│   ├── Storage
│   └── Secure API Services
│
└── Platform Applications
    ├── PWA
    ├── Windows Desktop
    └── Android
```

---

## Project Structure

The proposed project structure:

```text
devdesk/
│
├── apps/
│   ├── web/
│   ├── desktop/
│   └── android/
│
├── packages/
│   ├── ui/
│   ├── design-tokens/
│   ├── core/
│   ├── feature-snippets/
│   ├── feature-notes/
│   ├── feature-api-studio/
│   ├── feature-tools/
│   ├── feature-projects/
│   ├── feature-errors/
│   ├── feature-analytics/
│   ├── feature-ai/
│   ├── platform-adapters/
│   └── types/
│
├── backend/
│   ├── migrations/
│   ├── functions/
│   └── api/
│
├── docs/
│   ├── product/
│   ├── architecture/
│   ├── security/
│   └── user-guide/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── public/
├── README.md
├── package.json
└── LICENSE
```

---

## Installation

### Prerequisites

Before installing DevDesk, make sure you have:

- Node.js (LTS recommended)
- npm
- Git
- A code editor such as Visual Studio Code

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/DevDesk.git
```

### 2. Navigate to the Project

```bash
cd DevDesk
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env.local` file in the project root if your configuration requires it.

Example:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Do not commit your environment files or private credentials.

### 5. Start the Development Server

```bash
npm run dev
```

### 6. Build for Production

```bash
npm run build
```

### 7. Preview the Production Build

```bash
npm run preview
```

> Commands may change depending on the final project structure and package configuration.

---

## Environment Configuration

DevDesk may use environment variables to connect to external services.

| Variable               | Description                    |
| ---------------------- | ------------------------------ |
| VITE_SUPABASE_URL      | Supabase project URL           |
| VITE_SUPABASE_ANON_KEY | Public client key for Supabase |

Never expose service-role keys, private API keys, database passwords, or other privileged credentials in frontend code.

---

## Privacy & Security

Privacy and security are important design principles of DevDesk.

- Secure authentication and session management.
- User-owned data protection.
- Database Row Level Security.
- Input validation and sanitization.
- Protection against cross-site scripting.
- Secure environment variable handling.
- No private credentials inside source code.
- Local-first processing for suitable developer tools.
- Transparent AI data usage.
- User-controlled data export and deletion.
- No unrestricted backend code execution.
- Protection against unsafe API proxy requests.

Users should never store sensitive credentials, private keys, or passwords inside code snippets or notes without appropriate protection.

---

## Offline Support

DevDesk is intended to support selected offline capabilities.

The planned offline system includes:

- Local data caching.
- IndexedDB storage.
- Offline access to saved snippets and notes.
- Local developer utilities.
- Queued changes when the network is unavailable.
- Synchronization after reconnecting.
- Visible synchronization status.

Offline availability may vary depending on the platform and implemented features.

---

## Development Roadmap

### Phase 0 — Product & Design

- [x] Product concept
- [x] Master blueprint
- [ ] Brand identity finalization
- [ ] Design system
- [ ] UI planning

### Phase 1 — Foundation

- [ ] Repository setup
- [ ] React and TypeScript setup
- [ ] Responsive application shell
- [ ] Sidebar and navigation
- [ ] Theme system
- [ ] Reusable components

### Phase 2 — Core Workspace

- [ ] Dashboard
- [ ] Code Vault
- [ ] DevNotes
- [ ] Command Library
- [ ] Data Lab
- [ ] Universal Search
- [ ] Local persistence

### Phase 3 — Backend & Synchronization

- [ ] Authentication
- [ ] Database integration
- [ ] Secure data ownership
- [ ] Cloud persistence
- [ ] Offline queue
- [ ] Sync system

### Phase 4 — Cross-Platform

- [ ] PWA support
- [ ] Mobile optimization
- [ ] Windows Desktop with Tauri
- [ ] Windows installer
- [ ] Android packaging evaluation

### Phase 5 — Beta Testing

- [ ] User testing
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] Accessibility review
- [ ] Security review

### Phase 6 — Release 1.0

- [ ] Production deployment
- [ ] Official website
- [ ] Download center
- [ ] Documentation
- [ ] Verified release builds

### Future Development

- [ ] Advanced API Studio
- [ ] AI Assistant
- [ ] Error Archive
- [ ] Project Hub
- [ ] Dev Analytics
- [ ] GitHub integration
- [ ] Knowledge graph
- [ ] Extensions system

---

## Testing

DevDesk aims to maintain reliable and tested functionality.

### Unit Testing

- Developer utilities.
- Data processing.
- Input validation.
- Core application logic.

### Integration Testing

- Authentication.
- Database operations.
- CRUD functionality.
- API request workflows.
- Offline synchronization.

### End-to-End Testing

- Onboarding.
- Authentication.
- Creating and editing snippets.
- Note management.
- Search.
- Project and task management.
- PWA installation.
- Desktop application workflows.

---

## Contributing

Contributions, suggestions, bug reports, and feature requests are welcome.

If you want to contribute:

1. Fork the repository.
2. Create a new branch.
3. Make your changes.
4. Test your changes.
5. Submit a Pull Request.

Please keep contributions clean, documented, secure, and consistent with the project's design principles.

---

## Design Philosophy

DevDesk follows these principles:

- **Simplicity:** Keep tools easy to understand and use.
- **Productivity:** Reduce unnecessary context switching.
- **Consistency:** Maintain a unified experience across platforms.
- **Privacy:** Protect personal notes, code, and data.
- **Performance:** Keep the application fast and responsive.
- **Accessibility:** Support different devices and interaction methods.
- **Quality:** Build real functionality instead of visual-only features.

---

## License

This project is currently under development.

The final license will be determined before the public release. Until a license is added, all rights are reserved by the project owner.

---

## Author

**Md. Kamruzzaman**
Founder & Developer of DevDesk

*Building tools that make development simpler, smarter, and more productive.*

---

\<p align="center">
&#x20; Designed & developed with passion for the developer community.
\</p>
