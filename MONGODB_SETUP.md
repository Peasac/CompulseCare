# MongoDB Setup Guide

## Current Status
✅ **Your app is now running WITHOUT crashing** - all routes have fallback behavior when MongoDB is not connected.

## Why You Don't See Schemas in MongoDB Compass

MongoDB collections (schemas) **only appear after the first document is inserted**. An empty database shows nothing in Compass.

## How to Fix

### Step 1: Add Your MongoDB URI

Edit [`.env.local`](.env.local) and replace with your actual MongoDB connection string:

```env
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/compulsecare?retryWrites=true&w=majority
```

Get your connection string from:
1. MongoDB Atlas Dashboard → Connect → Drivers
2. Copy the connection string
3. Replace `<password>` with your actual password
4. Replace `<database>` with `compulsecare`

### Step 2: Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

You should see:
```
[MongoDB] Connected successfully
```

If you see warnings instead:
```
[MongoDB] WARNING: MONGODB_URI not defined
```
→ Your `.env.local` file isn't loaded correctly.

### Step 3: Test the Connection

Visit http://localhost:3001 and:
1. Click the **Panic** button (this will create a PanicEvent)
2. Log a mood entry (this will create a Mood document)
3. Add a compulsion log (this will create a JournalEntry)
4. Create a target (this will create a Target)

### Step 4: Refresh MongoDB Compass

After adding data through the app:
1. Open MongoDB Compass
2. Refresh your connection
3. You should now see these collections:
   - `journalentries`
   - `moods`
   - `targets`
   - `panicevents`
   - `users` (created when first user document is added)

## What Was Changed

All API routes now handle MongoDB gracefully:

- ✅ **If MongoDB is connected**: Data is saved/retrieved from database
- ✅ **If MongoDB is NOT connected**: App returns mock/empty data instead of crashing

This means:
- Your app works even without MongoDB (for development/testing)
- No more crashes when MONGODB_URI is missing
- Console warnings tell you when MongoDB isn't connected

## Troubleshooting

### "MongoDB not connected" warnings
→ Check your `.env.local` file has the correct MONGODB_URI

### Still no collections in Compass
→ Make sure you've actually created data through the app (click buttons, log entries)

### Connection timeout errors
→ Check your IP is whitelisted in MongoDB Atlas → Network Access

### Authentication failed
→ Double-check your username/password in the connection string
