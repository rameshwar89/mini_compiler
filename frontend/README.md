# Frontend - Next.js + Monaco Editor

This is the frontend interface for the mini compiler project.

## Setup

1. Install dependencies:
```bash
npm install
```

## Running the Development Server

```bash
npm run dev
```

The app will run on `http://localhost:3001` (or 3000 if available)

## Features

- **Monaco Editor** for code editing with syntax highlighting and auto-layout
- **Tabbed Interface** with 4 main tabs:
  1. **Parse Tree** - Graphical AST visualization with arrows (├─→, └─→, │)
  2. **Tokens** - Classified into 6 categories with nested tabs:
     - All, Keywords, Operators, Identifiers, Literals, Delimiters
  3. **Intermediate Code** - Three-address code display
  4. **Output** - Nested tabs for:
     - Program Output (print statements)
     - Variables (user-declared variables only, no temporaries)

## Architecture

The frontend communicates with the Python Flask backend running on port 5000 via API proxy configured in `next.config.mjs`.

### API Calls

```javascript
// Compile code
POST http://localhost:5000/api/compile
{
  "code": "let x = 10;\nprint(x);"
}

// Response includes all compilation stages
{
  "success": true,
  "tokens": [{type: "LET", value: "let", line: 1}, ...],
  "ast": {type: "Program", statements: [...]},
  "intermediate": ["x = 10", "print x"],
  "output": {
    "output": ["10"],
    "variables": {"x": 10}
  }
}
```

## Tech Stack

- Next.js 16.0.3 (React framework with Turbopack)
- React 19.2.0
- JavaScript (ES6+)
- Tailwind CSS 3.4.14
- Monaco Editor 4.7.0 (@monaco-editor/react)
- DOMPurify 3.3.0

## Key Components

- `page.js` - Main interface with state management and tabbed UI
- `CodeEditor.js` - Monaco Editor wrapper with custom options
- `ParseTreeViewer.js` - Recursive tree renderer with graphical arrows

## Build

For production build:
```bash
npm run build
npm start
```
