# AI Patient Voice Agent

A Next.js application that provides AI-powered patient consultation and medical history management with voice interaction capabilities.

## 🚀 Features Implemented

### ✅ Authentication System (Feature 1)
- **Secure User Registration & Login**
  - Strong password requirements (8+ chars, mixed case, numbers, special characters)
  - Input validation and sanitization using Zod
  - JWT-based authentication with 7-day token expiration
  - Bcrypt password hashing with salt rounds of 12
  - Protection against SQL injection and XSS attacks

- **User Management**
  - User profiles with first name, last name, username, and email
  - Unique username and email validation
  - Secure password storage and verification
  - Session management with localStorage

### ✅ Patient History Management (Feature 2)
- **HL7 FHIR US Core Patient Compliant Profile**
  - Complete demographic information (DOB, gender, contact details)
  - Address information with US state validation
  - Emergency contact management
  - Insurance and medical record tracking
  - Communication preferences and language settings

- **Medical Conditions Management**
  - Add, edit, and delete medical conditions
  - ICD-10/SNOMED code support
  - Severity and status tracking (active, inactive, resolved)
  - Date tracking (onset, diagnosis, resolution)
  - Healthcare provider attribution
  - Detailed notes and descriptions

- **Comprehensive Dashboard**
  - Profile completion tracking
  - Medical condition statistics
  - Tabbed interface for different data categories
  - Real-time data updates and validation

### ✅ AI Voice Nurse Agent (Feature 3)
- **Real-time Voice Conversations**
  - VAPI integration for natural voice interactions with built-in speech-to-text
  - Live conversation transcript with timestamps
  - Call controls (mute, end call, transcript toggle)

- **Intelligent Patient Context**
  - Automatic integration of patient profile data
  - Medical conditions history context
  - Past consultation summaries (last 3 consultations)
  - Initial concern context from user input

- **Professional Medical Guidance**
  - Empathetic AI nurse persona with medical knowledge
  - Appropriate medical disclaimers and limitations
  - Local healthcare provider recommendations
  - Emergency situation awareness and guidance

- **Consultation Management**
  - Automatic conversation summarization
  - Symptom and concern tracking
  - Follow-up recommendations storage
  - Complete consultation history with searchable records

### 🔄 Ready for Enhancement
- **Medications Management** (Database schema prepared)
- **Allergies Tracking** (Database schema prepared)
- **Family History Management** (Database schema prepared)
- **Advanced AI Features** (Conversation analytics, health trends)

## 🛠 Technology Stack

### Frontend
- **Next.js 15** with App Router
- **React 19** with TypeScript
- **ShadCN UI** - Pre-built accessible components
- **Aceternity UI** - Advanced animated components
- **Framer Motion** - Smooth animations
- **Tailwind CSS 4** - Modern styling
- **React Hook Form** + **Zod** - Form validation

### Backend & Database
- **Neon Database** - Serverless PostgreSQL
- **Drizzle ORM** - Type-safe database operations
- **NextJS API Routes** - Server-side endpoints

### Authentication & Security
- **JWT Tokens** - Stateless authentication
- **bcryptjs** - Secure password hashing
- **Zod** - Runtime input validation
- **Custom middleware** - Route protection

### AI & Voice
- **VAPI** - AI voice agent platform with built-in speech-to-text

## 📋 Setup Instructions

### Prerequisites
- Node.js 18+
- A Neon database account
- VAPI account and assistant (for AI voice agent)

### 1. Environment Configuration
Create a `.env.local` file with:

```env
# Database (Required)
DATABASE_URL="your_neon_database_connection_string"

# Authentication (Required)  
NEXTAUTH_SECRET="your_secure_random_string"
NEXTAUTH_URL="http://localhost:3000"

# AI Services (Required for voice consultations)
NEXT_PUBLIC_VAPI_PUBLIC_KEY="your_vapi_public_key"
NEXT_PUBLIC_VAPI_ASSISTANT_KEY="your_vapi_assistant_id"
```

### 2. Database Setup
```bash
# Generate database schema
npm run db:generate

# Push schema to your Neon database
npm run db:push

# (Optional) Open Drizzle Studio to view data
npm run db:studio
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000 - you'll be redirected to the login page.

## 🏗 Database Schema

### Users Table ✅
- Secure authentication with hashed passwords
- Profile information (name, email, username)
- Timestamps for account tracking

### Patient Profiles Table ✅ (HL7 FHIR US Core Compliant)
- Demographics (DOB, gender, language preferences)
- Contact information (phone, address, emergency contacts)
- Insurance details and medical record numbers
- Communication preferences

### Medical Conditions Table ✅
- Condition name and medical codes (ICD-10/SNOMED)
- Severity levels and status tracking
- Date management (onset, diagnosis, resolution)
- Healthcare provider attribution and notes

### Medications Table (Ready)
- Medication names, dosages, and frequencies
- Prescription tracking and status management
- Date ranges and prescribing physician info

### Allergies Table (Ready)
- Allergen tracking with reaction details
- Severity levels and verification status
- Onset dates and additional notes

### Family History Table (Ready)
- Family relationship and condition tracking
- Age information and cause of death data
- Medical history inheritance patterns

### Past Consultations Table (Ready)
- AI conversation summaries
- Symptom and diagnosis tracking
- Follow-up contact information
- Medical disclaimers

## 🔐 Security Features

- **Password Security**: Strong requirements with bcrypt hashing
- **Input Validation**: Zod schemas prevent malformed data
- **SQL Injection Protection**: Parameterized queries via Drizzle ORM
- **XSS Prevention**: Input sanitization and React's built-in protections
- **JWT Security**: Signed tokens with expiration
- **Route Protection**: Middleware guards for authenticated routes

## 📱 User Journey

1. **Landing** → Automatic redirect to login/dashboard
2. **Registration** → Secure account creation with validation
3. **Login** → JWT authentication with session management
4. **Dashboard** → Overview of available features and statistics
5. **Patient History** → Complete HL7 FHIR compliant profile management
   - Demographics and contact information
   - Medical conditions with detailed tracking
   - Insurance and emergency contact details
6. **Future**: AI voice consultations and conversation summaries

## 🚀 Next Steps

The foundation is complete! Ready to implement:

1. **Patient History Forms** - HL7 FHIR compliant data entry
2. **Assembly AI Integration** - Real-time voice transcription
3. **VAPI Voice Agent** - AI-powered medical consultations
4. **Conversation Storage** - Summary and follow-up management

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate database migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
```

## 🔧 Development Notes

- The build may show a DATABASE_URL error during static generation - this is expected
- All authentication routes are functional and tested
- UI components are responsive and accessible
- Database schema is production-ready with proper relationships

---

**Ready for AI integration!** The authentication foundation is solid, and the database schema supports the full patient voice agent workflow.
