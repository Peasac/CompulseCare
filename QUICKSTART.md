# Quick Start Guide - CompulseCare

## 🚀 Get Running in 5 Minutes

### Step 1: Install Node.js
Make sure you have Node.js 18+ installed:
```bash
node --version  # Should be 18.0.0 or higher
```

If not, download from [nodejs.org](https://nodejs.org/)

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Set Up Environment (Optional for Demo)
The app works out of the box with mock data, but to use real features:

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local if you want to test OpenAI integration:
# OPENAI_API_KEY=sk-your-key-here
```

### Step 4: Run Development Server
```bash
npm run dev
```

### Step 5: Open Your Browser
Navigate to: **http://localhost:3000**

## 🎯 What You Can Do Right Now

### ✅ Working Features (Mock Data)
- **Dashboard**: See the main interface with panic button
- **Panic Mode**: Click panic button → breathing exercise → supportive message
- **Journal**: Log compulsions with trigger pills and notes
- **Targets**: View daily/weekly targets with progress
- **Mood Tracker**: Log mood with emoji + intensity
- **Weekly Summary**: See mock analytics and insights

### ⚠️ What Needs Configuration
- **OpenAI Integration**: Uncomment code in `app/api/panic/route.ts` and `app/api/summary/route.ts`
- **Database**: Add MongoDB/PostgreSQL/Firebase (see API routes for examples)
- **Authentication**: Implement NextAuth.js (stub exists at `/api/auth/login`)
- **Data Persistence**: Currently uses in-memory storage (resets on restart)

## 🛠️ Common Tasks

### Add OpenAI Support
1. Get API key from https://platform.openai.com/
2. Add to `.env.local`: `OPENAI_API_KEY=sk-...`
3. Uncomment OpenAI code in:
   - `app/api/panic/route.ts` (lines with `// TODO: call OpenAI`)
   - `app/api/summary/route.ts` (lines with `// TODO: Generate LLM summary`)

### Add Database (MongoDB Example)
```bash
npm install mongodb mongoose

# Add to .env.local:
DATABASE_URL=mongodb://localhost:27017/compulsecare
```

Then update API routes to use Mongoose models instead of mock arrays.

### Add Real Authentication
```bash
npm install next-auth

# Create app/api/auth/[...nextauth]/route.ts
# See commented example in app/api/auth/login/route.ts
```

## 📱 Testing on Mobile

### Test Locally on Phone
1. Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Run: `npm run dev`
3. On phone, visit: `http://YOUR-IP:3000`
   Example: `http://192.168.1.100:3000`

### Mobile-First Features to Test
- ✅ Panic button sizing and touch targets
- ✅ Journal form (trigger pills, text input)
- ✅ Mood emoji selection
- ✅ Responsive navigation
- ✅ Vertical scroll layout

## 🎨 Customization

### Change Colors
Edit `app/globals.css`:
```css
:root {
  --primary: 37 99 235;     /* Change this */
  --accent: 6 182 212;      /* And this */
  --panic: 0 100% 84%;      /* Panic button color */
}
```

### Change Font
Edit `app/layout.tsx`:
```typescript
import { Roboto } from "next/font/google";
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "700"] });
```

### Modify User Name
Edit `app/page.tsx`:
```typescript
const [userName] = useState("Your Name"); // Change here
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000 (Windows)
npx kill-port 3000

# Or use a different port
npm run dev -- -p 3001
```

### Module Not Found Errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### TypeScript Errors
```bash
# Regenerate Next.js types
npm run dev
# Then restart your editor
```

## 📚 Next Steps

1. **Explore the Code**
   - Check out `app/page.tsx` for the main dashboard
   - Look at `app/api/*/route.ts` files for API stubs
   - Browse `components/` for reusable UI

2. **Read Full Documentation**
   - `README.md` - Complete project overview
   - `MIGRATION.md` - Migration details and TODOs
   - `.env.example` - Environment variables

3. **Implement Real Features**
   - Add database (see commented examples in API routes)
   - Configure OpenAI (uncomment LLM code)
   - Set up authentication (NextAuth.js recommended)

4. **Deploy**
   ```bash
   npm run build
   npm start
   ```
   Or deploy to Vercel/Railway/Render

## 💡 Tips

- **Mock Data is OK for Development**: The app works perfectly with mock data for UI testing
- **Mobile Testing is Key**: This is mobile-first, so test on real devices often
- **Accessibility Matters**: Use keyboard navigation and screen readers during testing
- **Incremental Implementation**: Add one feature at a time (DB → Auth → LLM)

## 🆘 Getting Help

- Check `README.md` for detailed docs
- Review TODO comments in code
- Check Next.js docs: https://nextjs.org/docs
- OpenAI API docs: https://platform.openai.com/docs

---

**You're all set! Start by running `npm run dev` and visiting http://localhost:3000** 🎉
