# EduBot Frontend Setup Guide

## Prerequisites

Before running the application, ensure you have the following installed:

1. **Node.js** (version 18.0.0 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** or **yarn** (comes with Node.js)
   - Verify npm: `npm --version`
   - Or install yarn: `npm install -g yarn`

## Setup Instructions

### 1. Download and Extract
- Download the project files
- Extract to your desired directory
- Open terminal/command prompt in the project root

### 2. Install Dependencies
```bash
# Using npm
npm install

# OR using yarn
yarn install
```

### 3. Install Required Dependencies
This project uses several modern libraries. Run:

```bash
# Core dependencies
npm install react react-dom
npm install lucide-react
npm install sonner@2.0.3
npm install motion/react
npm install recharts
npm install react-hook-form@7.55.0

# Development dependencies
npm install -D @types/react @types/react-dom
npm install -D typescript
npm install -D @vitejs/plugin-react
npm install -D vite
npm install -D tailwindcss@next
npm install -D autoprefixer
```

### 4. Create Package.json (if not included)
Create a `package.json` file in the root directory:

```json
{
  "name": "edubot-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.400.0",
    "sonner": "2.0.3",
    "motion": "^10.16.0",
    "recharts": "^2.8.0",
    "react-hook-form": "7.55.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.2.2",
    "vite": "^5.3.4",
    "tailwindcss": "^4.0.0-alpha.26",
    "autoprefixer": "^10.4.19"
  }
}
```

### 5. Create Vite Configuration
Create `vite.config.ts` in the root:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  server: {
    port: 3000,
    host: true
  }
})
```

### 6. Create TypeScript Configuration
Create `tsconfig.json` in the root:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 7. Create HTML Entry Point
Create `index.html` in the root:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EduBot - AI Academic Tutor</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
```

### 8. Create Main Entry Point
Create `main.tsx` in the root:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### 9. Configure Tailwind CSS
Create `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## Running the Application

### Development Mode
```bash
# Using npm
npm run dev

# OR using yarn
yarn dev
```

The application will start on `http://localhost:3000`

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Backend Configuration

### Using Real Backend
1. Update the API base URL in `/config/api.ts`:
```typescript
export const API_BASE_URL = 'http://your-backend-url:port';
```

2. Ensure your backend is running and accessible

### Demo Mode (No Backend Required)
- The application automatically falls back to demo mode if the backend is unavailable
- All features work with mock data
- Perfect for testing and development

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process on port 3000
   npx kill-port 3000
   # Or use different port
   npm run dev -- --port 3001
   ```

2. **Module not found errors**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **TypeScript errors**
   ```bash
   # Check TypeScript configuration
   npx tsc --noEmit
   ```

4. **Tailwind styles not loading**
   - Ensure `globals.css` is imported in `main.tsx`
   - Check Tailwind configuration

### Development Tips

- Use browser developer tools for debugging
- Check console for API errors
- The app automatically switches to demo mode if backend is unavailable
- All user data is stored in localStorage for demo mode

## File Structure Overview
```
├── App.tsx              # Main application component
├── main.tsx             # React entry point
├── index.html           # HTML template
├── components/          # React components
├── services/           # API services
├── styles/             # CSS and styling
└── config/             # Configuration files
```

## Next Steps
1. Start the development server
2. Open http://localhost:3000 in your browser
3. Try the demo mode or connect to your backend
4. Begin development and customization

Happy coding! 🚀