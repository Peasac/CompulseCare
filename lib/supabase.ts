/**
 * Supabase Client Configuration
 * For storing uploaded documents (images, PDFs)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Upload file to Supabase Storage
 * @param file File to upload
 * @param userId User ID for organizing files
 * @returns Public URL of uploaded file
 */
export async function uploadDocumentToSupabase(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('OCR Docs')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error('Failed to upload file to storage');
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('OCR Docs')
    .getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Delete file from Supabase Storage
 * @param fileUrl Public URL of the file to delete
 */
export async function deleteDocumentFromSupabase(fileUrl: string): Promise<void> {
  try {
    // Extract path from URL
    const url = new URL(fileUrl);
    const path = url.pathname.split('/OCR%20Docs/')[1];
    
    if (path) {
      const { error } = await supabase.storage
        .from('OCR Docs')
        .remove([path]);
      
      if (error) {
        console.error('Supabase delete error:', error);
      }
    }
  } catch (error) {
    console.error('Error deleting from Supabase:', error);
  }
}
