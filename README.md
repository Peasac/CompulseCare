# CompulseCare

A compassionate, mobile-first mental health application for tracking and managing OCD and compulsive behaviors. Built with Next.js, React, TypeScript, and Tailwind CSS.

## 🌟 Features

### Core Features
- **🚨 Panic Mode**: Full-screen calming interface with breathing exercises and AI-powered supportive messages
- **📝 Micro-Journaling**: Quick 1-3 tap logging of compulsions with trigger tracking
- **🎯 Daily & Weekly Targets**: Set and track recovery goals with progress visualization
- **😊 Mood Tracking**: Log emotional states with emoji + intensity slider
- **📊 Weekly Summary**: AI-generated insights and visualizations of your progress
- **🔥 Streak Tracking**: Gamified daily engagement tracking

### Mobile-First Design
- Vertical scroll layout optimized for one-handed use
- Large touch targets (minimum 44x44px)
- Responsive design from mobile to desktop
- Accessibility features (ARIA labels, keyboard navigation)

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** (NOT Bun - this project has been migrated from Bun to Node.js)
- npm or yarn
- PostgreSQL, MongoDB, or Firebase (for production database)

### Installation

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd CompulseCare

# Step 3: Install dependencies
npm install

# Step 4: Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys and database URL

# Step 5: Run the development server
npm run dev

# Step 6: Open your browser
# Navigate to http://localhost:3000
```

## 📝 Environment Variables

Create a `.env` or `.env.local` file in the root directory and fill in your values:

```env
# Google Gemini API Key for LLM features
GEMINI_API_KEY=your-gemini-api-key-here

# Database URL
DATABASE_URL=mongodb://localhost:27017/compulsecare

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
```

**Getting a Gemini API Key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your `.env` file as `GEMINI_API_KEY`

## 📁 Project Structure

```
CompulseCare/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Main dashboard
│   ├── panic/page.tsx       # Panic mode
│   ├── journal/page.tsx     # Journal
│   ├── targets/page.tsx     # Targets
│   ├── mood/page.tsx        # Mood tracker
│   ├── summary/page.tsx     # Weekly summary
│   └── api/                 # API routes (server-side)
├── components/              # Shared components
│   ├── PanicButton.tsx
│   ├── JournalCard.tsx
│   ├── TargetCard.tsx
│   └── ui/                  # shadcn/ui components
└── .env.example            # Environment template
```

## 🔧 Key Integration TODOs

### 1. OpenAI Integration
Uncomment LLM code in:
- `app/api/panic/route.ts` - For supportive messages
- `app/api/summary/route.ts` - For weekly insights

### 2. Database Setup
Choose one and implement:
- MongoDB + Mongoose
- PostgreSQL + Prisma
- Firebase Firestore

See commented examples in all `/api/*` routes.

### 3. Authentication
Implement NextAuth.js or Firebase Auth. See `app/api/auth/login/route.ts` for stubs.

### 4. Optional Enhancements
- Add Lottie animations: `npm install lottie-react`
- Add focus trap: `npm install focus-trap-react`

## 🎨 Design Tokens

- **Primary**: `#2563EB` (blue)
- **Accent**: `#06B6D4` (cyan)
- **Background**: `#F5F6FA` (light gray)
- **Panic**: `#FFADAD` (soft red)
- **Font**: Inter
- **Spacing**: 8px grid
- **Border Radius**: 12px

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Runtime**: Node.js (migrated from Bun)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI**: shadcn/ui + Radix UI
- **Charts**: Recharts
- **Icons**: Lucide React

## 🚀 Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

Deploy to Vercel, Railway, or any Node.js hosting platform.

## 🆘 Crisis Support

This app is not a substitute for professional care.

- **US**: 988 (Suicide & Crisis Lifeline)
- **UK**: 116 123 (Samaritans)
- **International**: https://findahelpline.com/

---

Built with ❤️ for mental health awareness

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
