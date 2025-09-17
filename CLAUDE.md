# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with hot reload (custom server with Socket.IO)
- `npm run build` - Build for production using Next.js
- `npm start` - Start production server with custom server
- `npm run lint` - Run ESLint for code quality checks

### Database Commands
- `npm run db:push` - Push Prisma schema to database
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:reset` - Reset database and run migrations

## Project Architecture

This is an **AI Document Summarizer** application built with Next.js 15, TypeScript, and a custom server setup that integrates Socket.IO for real-time functionality.

### Core Technology Stack
- **Next.js 15** with App Router for the main application
- **Custom Node.js server** (`server.ts`) that combines Next.js with Socket.IO
- **Prisma ORM** with SQLite database for data persistence
- **NextAuth.js** for authentication (configuration in `/src/app/api/auth/[...nextauth]/route.ts`)
- **shadcn/ui** components with Tailwind CSS for UI
- **Z.ai SDK** (`z-ai-web-dev-sdk`) for AI-powered document summarization

### Application Flow
1. **Authentication**: Users sign in via NextAuth.js
2. **Document Upload**: Users upload PDF, DOCX, or TXT files via drag-and-drop interface
3. **Text Extraction**: Server extracts text using `pdf-parse` (PDF), `mammoth` (DOCX), or direct reading (TXT)
4. **AI Summarization**: Text is sent to Z.ai API for intelligent summarization with multiple summary types (STANDARD, EXECUTIVE, TECHNICAL, BULLET_POINTS)
5. **Storage & History**: Summaries are stored in SQLite database and displayed in history tab
6. **Export**: Users can export summaries as TXT, PDF, or Markdown files

### Key Files & Directories
- `server.ts` - Custom server combining Next.js and Socket.IO
- `src/app/page.tsx` - Main application UI with upload, summary, and history tabs
- `src/app/api/summarize/route.ts` - Core API endpoint for document processing and summarization
- `src/app/api/export/` - Export endpoints for different file formats (txt, pdf, markdown)
- `src/app/api/history/route.ts` - User summary history management
- `src/lib/db.ts` - Prisma client configuration
- `src/lib/socket.ts` - Socket.IO setup (currently implements echo functionality)
- `prisma/schema.prisma` - Database schema with User, Document, Summary, Usage models

### Database Schema
- **Users**: Basic user information and authentication
- **Documents**: File metadata and extracted text
- **Summaries**: Generated summaries with different types and word counts
- **Usage**: Tracking for different user actions (uploads, summaries, exports)
- **UserPlan**: Subscription/plan management with Stripe integration

### Development Server
The application uses a custom server setup that runs both Next.js and Socket.IO on the same port (3000). The server configuration handles both web requests and WebSocket connections, with Socket.IO available at `/api/socketio`.

### Environment Variables
Ensure these are configured:
- `DATABASE_URL` - SQLite database connection string
- `NEXTAUTH_SECRET` - Authentication secret
- `NEXTAUTH_URL` - Application URL for auth callbacks
- Z.ai API credentials (handled by z-ai-web-dev-sdk)