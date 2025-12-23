# Supabase Setup for Document Storage

This project uses Supabase Storage to store uploaded documents (images and PDFs).

## Setup Instructions

### 1. Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details and create

### 2. Create Storage Bucket
1. In your Supabase dashboard, go to **Storage**
2. Click "Create a new bucket"
3. Name it: `documents`
4. Set it to **Public** (so users can view their uploaded documents)
5. Click "Create bucket"

### 3. Set Up Storage Policies
1. Click on the `documents` bucket
2. Go to **Policies** tab
3. Click "New Policy"

**Insert Policy** (Allow users to upload):
```sql
CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents');
```

**Select Policy** (Allow users to view):
```sql
CREATE POLICY "Public documents are viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');
```

**Delete Policy** (Allow users to delete their own):
```sql
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents');
```

### 4. Get Your Credentials
1. Go to **Settings** → **API**
2. Copy your:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (the `anon` `public` key)

### 5. Add to Environment Variables
Create a `.env.local` file in the root directory (if it doesn't exist) and add:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** Replace the values with your actual Supabase credentials.

### 6. Restart Development Server
```bash
npm run dev
```

## Features Enabled

✅ **Upload Documents**: Images and PDFs are stored in Supabase
✅ **View Original**: Click the 👁️ View button to see the original document
✅ **View OCR**: See extracted text in a modal
✅ **Export PDF**: Generate formatted PDF from OCR text
✅ **Automatic Cleanup**: When documents are deleted from the app, they're also removed from Supabase

## Storage Structure

Files are organized by user ID:
```
documents/
  └── {userId}/
      ├── 1234567890_abc123.png
      ├── 1234567890_def456.pdf
      └── ...
```

## Cost & Limits

- **Free Tier**: 1 GB storage
- **Bandwidth**: 2 GB transfer per month
- **Upgrade**: If you need more, check Supabase pricing

## Security Notes

- Files are publicly accessible via URL (anyone with the link can view)
- Consider adding RLS (Row Level Security) if you need stricter access control
- File paths include random strings for obscurity
- Users can only delete documents through the authenticated API

## Troubleshooting

**Error: "Failed to upload file to storage"**
- Check your Supabase credentials in `.env.local`
- Verify the `documents` bucket exists and is public
- Check bucket policies are set correctly

**Files not appearing:**
- Make sure bucket is set to **Public**
- Check browser console for CORS errors
- Verify the public URL is being generated correctly
