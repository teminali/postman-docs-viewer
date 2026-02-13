# NexusDocer

**API & Database Documentation Made Simple**

NexusDocer is a developer-first documentation platform that turns Postman collections and Firestore database schemas into interactive, browsable documentation -- with a built-in AI-free Assistant that generates structured prompts and production-ready code snippets for 10+ frameworks.

**Live:** [nexusdocer.web.app](https://nexusdocer.web.app)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Core Features](#core-features)
  - [Postman Collection Viewer](#postman-collection-viewer)
  - [Firestore Schema Viewer](#firestore-schema-viewer)
  - [Assistant (Prompt & Code Generator)](#assistant-prompt--code-generator)
  - [Code Viewer](#code-viewer)
  - [Publishing & Sharing](#publishing--sharing)
  - [API Playground](#api-playground)
  - [Flowchart Generator](#flowchart-generator)
  - [User Guide Export](#user-guide-export)
  - [Markdown Export](#markdown-export)
- [Supported Frameworks](#supported-frameworks)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [Scripts](#scripts)
- [License](#license)

---

## Features

- **Import Postman JSON** -- Drag-and-drop or upload a Postman collection export to get instant, structured API documentation
- **Firestore Schema Viewer** -- Connect a Firebase project, scan the database, and generate documentation for all collections, fields, indexes, and security rules
- **Assistant (No AI Required)** -- Rule-based engine that generates structured prompts for AI editors (Cursor, Copilot, ChatGPT) and production-ready code snippets for 10 frameworks, without making any AI API calls
- **Dual View Modes** -- Switch between Developer mode (raw technical detail) and User mode (clean, readable documentation)
- **Code Snippets** -- Generate framework-specific API client code with types, error handling, and authentication
- **API Playground** -- Test endpoints directly from the documentation with real HTTP requests
- **Publish & Share** -- Publish documentation to the cloud (public or private) and share via link
- **User Guide Export** -- Export a complete, user-friendly guide for the entire collection as PDF, Word (.docx), or Markdown -- no raw API endpoints, just human-readable action guides
- **Markdown Export** -- Export full collections or individual endpoints as `.md` files
- **Flowchart Generation** -- Auto-generate API flow diagrams using Mermaid
- **Search** -- Fuzzy search across all endpoints, folders, and collections
- **Dark/Light Theme** -- System-aware theme with manual toggle
- **History** -- Automatically saves recently loaded collections for quick access
- **Code Viewer** -- Syntax-highlighted output with editor mode, fullscreen view, search, line numbers, word wrap, download, and copy

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| UI Components | [Radix UI](https://radix-ui.com) + [shadcn/ui](https://ui.shadcn.com) |
| Icons | [Lucide React](https://lucide.dev) |
| Authentication | Firebase Authentication (Email/Password + Google) |
| Database | Cloud Firestore (publishing, shared docs) |
| Syntax Highlighting | [prism-react-renderer](https://github.com/FormidableLabs/prism-react-renderer) |
| Diagrams | [Mermaid](https://mermaid.js.org) |
| Search | [Fuse.js](https://fusejs.io) |
| Animations | [Framer Motion](https://www.framer.com/motion) |
| Notifications | [Sonner](https://sonner.emilkowal.dev) |
| Command Menu | [cmdk](https://cmdk.paco.me) |
| PDF Export | [jsPDF](https://github.com/parallax/jsPDF) |
| Word Export | [docx](https://github.com/dolanmiu/docx) + [file-saver](https://github.com/eligrey/FileSaver.js) |

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/postman-docs-viewer.git
cd postman-docs-viewer

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in your Firebase config values (see Environment Variables)

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

> **Note:** The app works without Firebase configuration -- authentication and publishing features will be disabled, but the core documentation viewer and assistant work fully offline.

---

## Environment Variables

Create a `.env.local` file from `.env.example`:

```env
# Firebase Configuration
# Get these from Firebase Console → Project Settings → General → Your apps (Web)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

### Firebase Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** → Sign-in method → enable **Email/Password** and **Google**
3. Enable **Cloud Firestore** (start in production mode)
4. Create a **Web App** and copy the config values
5. In Google Cloud Console, ensure **Identity Toolkit API** and **Token Service API** are enabled

---

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (providers, fonts, metadata)
│   ├── page.tsx                  # Landing page
│   ├── app/
│   │   └── page.tsx              # Main application (Postman + Firestore viewer)
│   ├── docs/
│   │   ├── page.tsx              # Published docs browser
│   │   └── view/
│   │       └── page.tsx          # Published doc viewer
│   ├── login/page.tsx            # Sign in
│   ├── signup/page.tsx           # Sign up
│   ├── forgot-password/page.tsx  # Password reset
│   ├── settings/page.tsx         # User settings
│   └── api/
│       └── proxy/route.ts        # CORS proxy for API Playground
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui base components (19 files)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── sheet.tsx
│   │   ├── tabs.tsx
│   │   └── ...
│   │
│   ├── file-upload.tsx           # Collection upload with drag-and-drop
│   ├── sidebar-nav.tsx           # Folder tree navigation sidebar
│   ├── collection-overview.tsx   # Collection stats and summary
│   ├── dev-view.tsx              # Developer documentation view
│   ├── user-view.tsx             # User-friendly documentation view
│   ├── search-command.tsx        # Fuzzy search command palette (Cmd+K)
│   │
│   ├── assistant-sheet.tsx           # Postman Assistant (prompt & code gen)
│   ├── firestore-assistant-sheet.tsx # Firestore Assistant
│   ├── code-viewer.tsx               # Syntax-highlighted code viewer
│   │
│   ├── api-playground.tsx        # Live API request tester
│   ├── api-code-snippets.tsx     # API code snippet viewer
│   ├── flowchart-sheet.tsx       # Mermaid flowchart generator
│   │
│   ├── firestore-schema-viewer.tsx   # Firestore schema documentation
│   ├── firestore-collection-detail.tsx
│   ├── firestore-code-snippets.tsx
│   ├── firestore-data-explorer.tsx
│   ├── firestore-schema-upload.tsx
│   │
│   ├── publish-sheet.tsx         # Publish docs to cloud
│   ├── firebase-docs-sheet.tsx   # Browse published docs
│   ├── firestore-publish-sheet.tsx
│   ├── connect-db-sheet.tsx      # External database connection
│   │
│   ├── simple-markdown.tsx       # Markdown renderer
│   ├── mermaid-diagram.tsx       # Mermaid diagram renderer
│   └── theme-provider.tsx        # Dark/light theme context
│
├── lib/                          # Core logic and utilities
│   ├── postman-parser.ts         # Postman collection JSON parser
│   ├── prompt-engine.ts          # API prompt & code generation engine
│   ├── firestore-prompt-engine.ts # Firestore prompt & code generation
│   ├── api-snippet-generator.ts  # API code snippet templates
│   ├── firestore-snippet-generator.ts
│   ├── api-request-executor.ts   # HTTP request executor (playground)
│   ├── markdown-export.ts        # Markdown export utilities
│   ├── user-guide-export.ts     # User Guide export (PDF, Word, Markdown)
│   ├── firestore-schema-export.ts
│   ├── published-docs.ts         # Cloud publishing (Firestore)
│   ├── collection-storage.ts     # Local storage (history)
│   ├── firebase.ts               # Firebase initialization
│   ├── firestore-introspector.ts # Database schema scanner
│   ├── firestore-rules-parser.ts # Security rules parser
│   ├── firestore-indexes-parser.ts
│   ├── firestore-data-explorer.ts
│   ├── external-db-settings.ts   # External DB connection config
│   ├── external-db-docs.ts
│   ├── flow-graph.ts             # Flowchart data generation
│   ├── search.ts                 # Fuse.js search setup
│   └── utils.ts                  # General utilities (cn, etc.)
│
├── contexts/
│   └── auth-context.tsx          # Firebase auth provider and hooks
│
└── types/
    ├── postman.ts                # Postman collection type definitions
    └── firestore-schema.ts       # Firestore schema type definitions
```

---

## Architecture

### Data Flow

```
Postman JSON file ──→ postman-parser.ts ──→ ParsedCollection ──→ UI Components
                                                                  ├── DevView / UserView
                                                                  ├── AssistantSheet → prompt-engine.ts → CodeViewer
                                                                  ├── API Playground → api-request-executor.ts
                                                                  ├── Code Snippets → api-snippet-generator.ts
                                                                  ├── Flowchart → flow-graph.ts → Mermaid
                                                                  └── User Guide Export → user-guide-export.ts → PDF / Word / Markdown

Firebase Credentials ──→ firestore-introspector.ts ──→ FirestoreSchema ──→ UI Components
                                                                           ├── FirestoreSchemaViewer
                                                                           ├── FirestoreAssistantSheet → firestore-prompt-engine.ts → CodeViewer
                                                                           ├── Data Explorer → firestore-data-explorer.ts
                                                                           └── Code Snippets → firestore-snippet-generator.ts
```

### Key Types

**ParsedCollection** (Postman):
```typescript
interface ParsedCollection {
  name: string;
  description: string;
  endpoints: ParsedEndpoint[];
  folderTree: FolderNode[];
  variables: PostmanVariable[];
  totalFolders: number;
  totalRequests: number;
  methods: Record<string, number>;
}
```

**FirestoreSchema** (Database):
```typescript
interface FirestoreSchema {
  projectName: string;
  collections: FirestoreCollectionSchema[];
  indexes: FirestoreIndex[];
  fieldOverrides: FirestoreFieldOverride[];
  rawRules: string | null;
  scannedAt: number;
}
```

### State Management

The app uses React's built-in state management:
- `useState` / `useMemo` / `useCallback` for component state
- `Context API` for authentication (`AuthProvider`) and theming (`ThemeProvider`)
- `localStorage` for collection history and settings (via `collection-storage.ts`)
- No external state library needed

---

## Core Features

### Postman Collection Viewer

Upload a Postman collection export (JSON v2.1) to get instant documentation:

- **Sidebar navigation** with folder tree structure
- **Dev mode**: Full technical detail -- headers, query params, path variables, request/response bodies, authentication
- **User mode**: Clean, readable endpoint documentation
- **Method badges**: Color-coded HTTP methods (GET, POST, PUT, PATCH, DELETE)
- **Endpoint detail**: URL, description, headers, body schema, example responses
- **Collection overview**: Stats cards, method distribution, folder summary

### Firestore Schema Viewer

Connect a Firebase project to scan and document your database:

- **Collection list** with field counts and sample doc counts
- **Field detail**: Name, type, frequency (required/optional based on sampling), nested fields for maps
- **Subcollections**: Recursive display of nested collections
- **Indexes**: Composite index listing with fields and query scope
- **Security rules**: Display raw rules text
- **Export**: Full database or per-collection Markdown export

### Assistant (Prompt & Code Generator)

The heart of the platform. A **rule-based, zero-AI-cost** engine that generates:

#### Generate Prompt Mode
Produces structured Markdown prompts optimized for AI editors like Cursor, Copilot, or ChatGPT. Includes:
- Full endpoint/collection schemas with types
- Framework-specific guidelines
- Task context from 8 templates

**Templates:**
| Template | Purpose |
|---|---|
| Implement | Build a new integration from scratch |
| Bug Fix | Fix issues with existing code |
| Update | Add features to existing integration |
| Refactor | Improve code quality and architecture |
| Test | Generate comprehensive test suites |
| Migrate | Create migration scripts |
| Document | Generate technical documentation |
| Optimize | Performance and cost optimization |

#### Generate Code Mode
Produces production-ready code with:
- Type-safe interfaces/models per endpoint or collection
- CRUD operations (for Firestore: create, read, update, delete + real-time listeners)
- Error handling with try/catch and meaningful error messages
- Authentication headers / Firebase SDK auth
- Usage examples

#### Scope Selection
- **All endpoints/collections**: Generate for everything
- **Custom selection**: Pick specific folders, endpoints, or collections with search and multi-select

#### Options
**Postman Assistant:**
- Type definitions
- Error handling
- Authentication
- Usage examples
- Unit tests

**Firestore Assistant:**
- Type definitions
- Error handling
- CRUD operations
- Real-time listeners
- Security rules context
- Unit tests

### Code Viewer

A mini IDE for viewing and editing generated output:

- **Syntax highlighting** via prism-react-renderer (One Dark theme)
- **Editor mode** -- Edit generated code with a transparent textarea overlay that preserves syntax coloring
- **Fullscreen view** -- Dialog-based full-screen code viewer
- **Search** (Cmd+F) -- Find in code with match navigation and highlighting
- **Line numbers** toggle
- **Word wrap** toggle
- **Download** -- Save output as a properly named file (e.g., `api-client.ts`, `firestore-client.py`)
- **Copy to clipboard**
- **Reset** -- Revert editor changes to original generated output
- **Status bar** -- Language, filename, mode, encoding

### Publishing & Sharing

Publish documentation to the cloud for team access:

- **Public docs**: Anyone with the link can view
- **Private docs**: Only the owner can view (requires sign-in)
- **Large payload support**: Collections over 800KB are automatically chunked into subcollection documents
- **Update**: Re-upload or re-scan to update published docs
- **Browse**: Searchable list of your published documents

### API Playground

Test API endpoints directly from the documentation:

- Send real HTTP requests (GET, POST, PUT, PATCH, DELETE)
- Set custom headers, query params, and request bodies
- View response status, headers, and body
- CORS proxy (`/api/proxy`) for cross-origin requests
- URL validation and private address blocking

### Flowchart Generator

Auto-generate API flow diagrams:

- Mermaid-based diagram rendering
- Visualize endpoint relationships and request flows
- Export diagrams as images

### User Guide Export

Export a complete, user-friendly guide for the entire API collection -- designed for non-technical stakeholders, product managers, and end users. Available in **User Guide mode** from the collection overview via the "Export Guide" dropdown.

**Formats:**

| Format | Description |
|---|---|
| **PDF** (.pdf) | Styled PDF with cover page, table of contents, categorized actions, step-by-step instructions, input tables, and response summaries. Generated with jsPDF. |
| **Word** (.docx) | Properly formatted Word document with headings, styled tables, action badges, and clean typography. Generated with the docx library. |
| **Markdown** (.md) | Clean Markdown user guide with TOC, folder sections, and endpoint guides in human-readable format. |

**What's included for each action:**
- Human-readable action name (e.g., "Create New User" instead of `POST /api/users`)
- Action type badge (View, Create, Update, Remove)
- Category breadcrumb
- Authentication requirement
- Step-by-step usage instructions
- Input fields table (name, required/optional, description)
- Response field summary
- Important notes for destructive actions (DELETE, PUT)

**What's excluded:**
- Raw API URLs, HTTP methods, and headers
- Technical request/response bodies
- Developer-specific details

### Markdown Export

Export technical documentation as Markdown files:

- **Full collection export** -- All endpoints in one `.md` file
- **Per-endpoint export** -- Individual endpoint documentation
- **Per-folder export** -- Folder-level documentation
- **Firestore export** -- Full database schema or indexes as Markdown
- Two styles: Developer (technical) and User (readable)

---

## Supported Frameworks

### API (Postman) Assistant

| Framework | Language | Description |
|---|---|---|
| TypeScript | `.ts` | Fetch + strict types |
| JavaScript | `.js` | Fetch API |
| React | `.tsx` | Custom hooks + TypeScript |
| Next.js | `.ts` | App Router server actions |
| Vue.js | `.ts` | Composables + TypeScript |
| Python | `.py` | requests / httpx |
| Flutter | `.dart` | Dart + http package |
| Swift | `.swift` | URLSession async/await |
| Kotlin | `.kt` | Ktor / OkHttp + coroutines |
| Node.js | `.ts` | Server-side fetch / Express |
| cURL | `.sh` | Command-line HTTP |

### Firestore Assistant

| Framework | Language | Description |
|---|---|---|
| TypeScript | `.ts` | Firebase SDK + strict types |
| JavaScript | `.js` | Firebase SDK |
| React | `.tsx` | React hooks + Firebase |
| Next.js | `.ts` | Server actions + Admin SDK |
| Vue.js | `.ts` | Composables + Firebase |
| Python | `.py` | firebase-admin SDK |
| Flutter | `.dart` | cloud_firestore package |
| Swift | `.swift` | FirebaseFirestore SDK |
| Kotlin | `.kt` | Firebase Android SDK |
| Node.js | `.ts` | firebase-admin server-side |

---

## Authentication

Firebase Authentication with two providers:

- **Email/Password** -- Standard sign up and sign in
- **Google** -- One-click Google sign in

**Features:**
- Password reset via email
- Profile updates (display name)
- Password change with reauthentication
- Account linking (Google + Email on same account)
- Persistent sessions

> Authentication is optional. The core viewer and assistant work without signing in. Sign-in is required for publishing and accessing private docs.

---

## Deployment

### Firebase Hosting

```bash
# Build the app
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

### Vercel

```bash
# Push to GitHub and connect to Vercel
# Or deploy directly:
npx vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Roadmap

What's next for NexusDocer:

### Near-term

- **Swagger / OpenAPI Import** -- Support `.yaml` and `.json` OpenAPI spec files alongside Postman collections, dramatically expanding the audience
- **Shareable Generated Output** -- Generate a short link for any prompt or code snippet so developers can share with teammates, turning individual utility into team adoption
- **Prompt Quality Feedback** -- Thumbs up/down on generated output to track which templates and frameworks are most useful and refine them over time
- **GraphQL Support** -- Import GraphQL schemas and generate queries, mutations, and typed client code

### Mid-term

- **Team Workspaces** -- Shared collections and docs within a team, with role-based access (viewer, editor, admin)
- **Version History** -- Track changes to published docs over time, diff between versions
- **Webhook & Event Documentation** -- Extend beyond request/response to document webhooks, SSE, and WebSocket events
- **Custom Templates** -- Let users create and save their own prompt templates beyond the built-in 8
- **CLI Tool** -- `npx nexusdocer generate` to run prompt/code generation from the terminal without opening the UI

### Long-term

- **VS Code / Cursor Extension** -- Bring the assistant directly into the editor as a sidebar panel
- **CI/CD Integration** -- Auto-generate and publish docs on every API change via GitHub Actions
- **Multi-language SDK Generation** -- Full SDK packages (not just snippets) with package.json, pubspec.yaml, etc.
- **API Changelog** -- Detect breaking changes between collection versions and generate migration guides
- **Analytics Dashboard** -- Track which endpoints are most viewed, most tested, and most exported

---

## License

This project is private. All rights reserved.
