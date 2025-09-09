# AI Patient Voice Agent - Setup Guide

This guide will help you set up the AI Patient Voice Agent application with all required technologies and dependencies.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- A Neon database account (https://neon.com)
- Assembly AI API key (https://www.assemblyai.com)
- VAPI API key (https://vapi.ai)

## Environment Setup

1. **Create Environment Variables**
   Create a `.env.local` file in the root directory with the following variables:

   ```env
   # Database (Required)
   DATABASE_URL="your_neon_database_url_here"

   # NextAuth (Required)
   NEXTAUTH_SECRET="your_nextauth_secret_here"
   NEXTAUTH_URL="http://localhost:3000"

   # Assembly AI (Required for voice features)
   ASSEMBLYAI_API_KEY="your_assemblyai_api_key_here"

   # VAPI (Required for AI voice agent)
   VAPI_API_KEY="your_vapi_api_key_here"
   ```

2. **Database Setup**
   
   a. Create a Neon database:
   - Go to https://neon.com and create an account
   - Create a new project and database
   - Copy the connection string to your `.env.local` file

   b. Generate and run database migrations:
   ```bash
   npm run db:generate
   npm run db:push
   ```

3. **Install Dependencies**
   All dependencies are already installed, but if you need to reinstall:
   ```bash
   npm install
   ```

## Technology Stack

### Frontend
- **NextJS 15** - React framework with App Router
- **React 19** - UI library
- **ShadCN UI** - Pre-built components (https://ui.shadcn.com)
- **Aceternity UI** - Advanced UI components (https://ui.aceternity.com)
- **Framer Motion** - Animations (required for Aceternity UI)
- **Tailwind CSS 4** - Styling framework

### Backend
- **Neon Database** - PostgreSQL database (https://neon.com)
- **Drizzle ORM** - Type-safe database ORM (https://orm.drizzle.team)
- **NextJS API Routes** - Server-side API endpoints

### Authentication
- **Custom JWT-based auth** - Secure token-based authentication
- **bcryptjs** - Password hashing
- **Zod** - Input validation and sanitization

### AI & Voice
- **Assembly AI** - Speech-to-text streaming (https://www.assemblyai.com)
- **VAPI** - AI voice agent integration (https://docs.vapi.ai)

## Database Schema

The application includes the following tables:

1. **users** - User authentication and profile information
2. **patient_history** - Medical history and conditions (HL7 FHIR compliant)
3. **past_consultations** - AI consultation summaries and follow-ups

## Features Implemented

### ✅ Feature 1: Authentication System
- User registration with strong password requirements
- Secure login with JWT tokens
- Input validation and sanitization
- Protected routes and middleware
- User session management

### 🔄 Coming Next:
- Patient History Management (HL7 FHIR compliant)
- AI Voice Agent Integration
- Past Consultations Storage

## Running the Application

1. **Development Server**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 in your browser

2. **Database Management**
   ```bash
   # View database in Drizzle Studio
   npm run db:studio
   
   # Generate new migrations after schema changes
   npm run db:generate
   
   # Push schema changes to database
   npm run db:push
   ```

## Usage

1. Navigate to http://localhost:3000
2. You'll be redirected to the login page
3. Click "Sign up here" to create a new account
4. Fill in the registration form with:
   - Username (letters, numbers, underscores only)
   - Valid email address
   - Strong password (8+ chars, uppercase, lowercase, number, special char)
   - First and last name
5. After registration, login with your credentials
6. Access the dashboard to manage your account

## Security Features

- **Password Requirements**: 8+ characters with mixed case, numbers, and special characters
- **Input Sanitization**: All user inputs are sanitized to prevent XSS
- **SQL Injection Protection**: Drizzle ORM provides parameterized queries
- **JWT Tokens**: Secure token-based authentication with expiration
- **Bcrypt Hashing**: Passwords are hashed with salt rounds of 12

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- More endpoints will be added for patient history and consultations

## Troubleshooting

1. **Database Connection Issues**
   - Verify your DATABASE_URL is correct
   - Ensure your Neon database is active
   - Check network connectivity

2. **Authentication Issues**
   - Verify NEXTAUTH_SECRET is set
   - Clear localStorage and try again
   - Check browser console for errors

3. **Build Issues**
   - Clear .next folder: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`
   - Check for TypeScript errors: `npm run build`

## Next Steps

After completing the setup, you can:
1. Set up Assembly AI for voice-to-text features
2. Configure VAPI for AI voice agent functionality
3. Implement patient history management
4. Add AI consultation features

For questions or issues, refer to the documentation links provided for each technology.
