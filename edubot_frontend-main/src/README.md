# EduBot - AI Academic Tutor Frontend

A modern, ChatGPT-like interface for the EduBot AI Academic Tutor system. Built with React, TypeScript, and Tailwind CSS.

## Features

- 🤖 **AI Chat Interface**: ChatGPT-like conversational experience
- 🔐 **Authentication**: User registration, login, and password reset
- 📁 **File Upload**: Support for PDF, Word, text, and image files
- 💬 **Chat Management**: Create, view, and delete chat sessions
- 🌙 **Dark/Light Mode**: Theme toggle with system preference detection
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- 🎨 **Modern UI**: Beautiful emerald/teal color scheme

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Backend API server running (see API endpoints below)

### Installation

1. **Clone or download the project**
   ```bash
   cd edubot-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and update `VITE_API_URL` to match your backend server:
   ```
   VITE_API_URL=http://localhost:8000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173` (or the port shown in terminal)

## API Configuration

The application expects a backend API with the following endpoints:

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Chat System
- `POST /api/chat` - Send message to AI tutor
- `GET /api/chat/history` - Get chat history
- `GET /api/chats` - List user's chats
- `DELETE /api/chats/{chat_id}` - Delete a chat
- `POST /api/chat/upload` - Upload files to chat

### System
- `GET /api/health` - Health check

## File Upload Support

Supported file types:
- **Documents**: PDF (.pdf), Word (.doc, .docx), Text (.txt)
- **Images**: JPEG (.jpg, .jpeg), PNG (.png), GIF (.gif)
- **Size limit**: 10MB per file

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000` |

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components (shadcn/ui)
│   ├── AuthForm.tsx    # Authentication form
│   ├── ChatInterface.tsx # Main chat interface
│   ├── ChatSidebar.tsx # Chat navigation sidebar
│   └── FileUpload.tsx  # File upload component
├── config/
│   └── api.ts          # API configuration
├── services/
│   └── api.ts          # API service layer
└── styles/
    └── globals.css     # Global styles and CSS variables
```

## Key Components

### Authentication
- **Registration**: Create new user account
- **Login**: Sign in with email/password
- **Password Reset**: Request password reset via email

### Chat Interface
- **Message Input**: Text area with file attachment support
- **AI Responses**: Formatted responses with follow-up suggestions
- **File Management**: Upload and manage files per chat session
- **Education Level**: Select appropriate difficulty level

### Sidebar Navigation
- **Chat History**: Browse previous conversations
- **New Chat**: Start fresh conversation
- **User Profile**: Display user info and logout option
- **Theme Toggle**: Switch between light and dark modes

## Customization

### Colors
The app uses a modern emerald/teal color scheme. Colors are defined in `/styles/globals.css` and can be customized by modifying the CSS custom properties.

### API Endpoints
Update `/config/api.ts` to modify API endpoints or add new ones.

### File Types
Modify the `allowedTypes` array in `FileUpload.tsx` to support additional file formats.

## Troubleshooting

### Common Issues

1. **"Process is not defined" error**
   - Make sure environment variables are prefixed with `VITE_`
   - Check that `.env` file is in project root

2. **API connection errors**
   - Verify backend server is running
   - Check `VITE_API_URL` in `.env` file
   - Ensure CORS is configured on backend

3. **File upload fails**
   - Check file size (max 10MB)
   - Verify file type is supported
   - Ensure backend file upload endpoint is working

### Development Tips

- Use browser dev tools to inspect API calls
- Check console for error messages
- Verify network tab for failed requests

## Production Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Configure environment**
   Set `VITE_API_URL` to your production API URL

3. **Deploy the `dist` folder**
   Upload to your hosting service (Netlify, Vercel, etc.)

## License

This project is part of the EduBot AI Academic Tutor system.