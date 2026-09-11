# SourceLearn Frontend

The frontend for SourceLearn is a modern Single Page Application (SPA) built with **React 19**, **TypeScript**, **React Router 7**, and a bespoke vanilla CSS design system inspired by vintage Canadian Hilroy exercise booklets.

---

## Tech Stack
- **Library**: React 19 (`react`, `react-dom`)
- **Routing**: React Router 7 (`react-router-dom`)
- **Language**: TypeScript 5+ (strict mode enabled)
- **Build Tool**: Vite 6+ with Hot Module Replacement (HMR)
- **Document Viewing**: Canvas-based PDF viewer with text-layer highlights
- **Styling**: Vanilla CSS design system with CSS custom properties, glassmorphism modals, and micro-animations

---

## Directory Structure
```
frontend/
├── src/
│   ├── api/          # Typed API client fetching from backend (port 8082)
│   │   ├── client.ts    # Base fetch wrapper with error handling
│   │   ├── notebooks.ts # Notebook endpoints
│   │   ├── documents.ts # Document upload & delete
│   │   └── messages.ts  # Chat messages & citation types
│   ├── components/   # Reusable UI components
│   │   ├── ChatInput.tsx          # Auto-growing chat input
│   │   ├── ChatMessage.tsx        # Message bubbles with citation pills
│   │   ├── ConfirmDeleteModal.tsx # Accessible confirmation modal
│   │   ├── CreateNotebookModal.tsx# Palette & icon picker modal
│   │   ├── EditNotebookModal.tsx  # Notebook settings editor
│   │   ├── FileUpload.tsx         # Drag & drop PDF uploader
│   │   ├── HilroySwoosh.tsx       # SVG exercise booklet swoosh graphic
│   │   ├── NotebookCard.tsx       # Interactive 3D booklet card
│   │   ├── NotebookIcon.tsx       # SVG icon registry
│   │   ├── PdfViewerPane.tsx      # Split-screen PDF canvas reader
│   │   └── StudySidebar.tsx       # Document sources & utility menu
│   ├── pages/        # Route views
│   │   ├── NotebooksPage.tsx      # Dashboard grid & overview stats
│   │   ├── StudyPage.tsx          # Multi-turn study workspace
│   │   └── NotFoundPage.tsx       # Themed 404 screen
│   ├── App.tsx       # Router configuration (BrowserRouter)
│   ├── App.css       # Core design system & layout styles
│   ├── index.css     # Global reset, typography, and lined paper background
│   └── main.tsx      # Root entrypoint
├── index.html        # HTML5 template
├── vite.config.ts    # Vite bundler config (port 3000)
└── package.json      # Dependencies and scripts
```

---

## Local Development
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your web browser.
