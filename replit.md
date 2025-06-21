# Modern Full-Stack Authentication Application

## Overview

This is a modern full-stack web application built with React (frontend) and Express.js (backend), featuring authentication through an external API. The application uses a monorepo structure with shared TypeScript schemas and includes a comprehensive UI component library based on shadcn/ui.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: External API integration (https://ai.metqm.com)
- **Session Management**: In-memory storage with extensible interface for database integration
- **Development**: TSX for TypeScript execution in development
- **Production**: ESBuild for server bundling

### Database Design
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema Management**: Shared schema definitions between client and server
- **Tables**:
  - `users`: User account information (id, username, password)
  - `sessions`: Authentication sessions (tokens, expiration, user relationship)
- **Validation**: Zod schemas for runtime type checking

## Key Components

### Authentication System
- External API integration for credential validation
- JWT-like token management (access_token, refresh_token)
- Session persistence with configurable storage backend
- Form validation with user feedback

### UI Component Library
Complete set of accessible components including:
- Form controls (Input, Button, Checkbox, Select)
- Layout components (Card, Dialog, Sheet, Tabs)
- Navigation (Breadcrumb, Navigation Menu, Pagination)
- Feedback (Toast, Alert, Progress)
- Data display (Table, Avatar, Badge)

### Development Experience
- Hot Module Replacement (HMR) via Vite
- Runtime error overlay for debugging
- TypeScript strict mode with path mapping
- Comprehensive linting and formatting setup

## Data Flow

### Authentication Flow
1. User submits credentials via React Hook Form
2. Frontend validates input using Zod schemas
3. Credentials sent to Express backend API endpoint
4. Backend forwards credentials to external authentication service
5. On success, user record created/retrieved from database
6. Session created with tokens and expiration
7. Frontend receives success response and redirects to dashboard

### Error Handling
- Client-side validation prevents invalid submissions
- Server-side validation provides fallback protection
- Toast notifications for user feedback
- Graceful error boundaries for React component failures

## External Dependencies

### Core Framework Dependencies
- React ecosystem (react, react-dom, @types/react)
- Express.js with TypeScript support
- Drizzle ORM with PostgreSQL driver (@neondatabase/serverless)

### UI and Styling
- Radix UI component primitives
- Tailwind CSS with PostCSS
- Class variance authority for component variants
- Lucide React for consistent iconography

### Development Tools
- Vite with React plugin
- TSX for TypeScript execution
- ESBuild for production bundling
- Replit-specific development plugins

### Authentication Integration
- External API: https://ai.metqm.com/api/adminportal/get_agentlist_r1.cfm
- Form data submission with client credentials
- OAuth2-like flow with grant_type parameter

## Deployment Strategy

### Development Environment
- Replit-hosted with PostgreSQL 16 module
- Hot reload via `npm run dev` on port 5000
- Environment variables for database connection

### Production Build
- Vite builds frontend to `dist/public`
- ESBuild bundles server to `dist/index.js`
- Static file serving from Express
- Autoscale deployment target on Replit

### Configuration
- Database URL required via environment variable
- Client ID/Secret for external authentication
- Session management configurable (currently in-memory)

### Performance Optimizations
- ES modules throughout for better tree shaking
- Vite's optimized build process
- Component code splitting ready
- Static asset optimization

## Changelog
- June 20, 2025. Initial setup with login page and external API authentication
- June 21, 2025. Added dashboard with collapsible sidebar, agent management interface, and CRUD API endpoints

## User Preferences

Preferred communication style: Simple, everyday language.