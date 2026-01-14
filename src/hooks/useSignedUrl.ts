import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to generate signed URLs for private storage bucket files.
 * This is used instead of public URLs for security.
 */
export const useSignedUrl = (filePath: string | null | undefined) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const generateSignedUrl = async () => {
      if (!filePath) {
        setSignedUrl(null);
        return;
      }

      // Check if it's already a full URL (legacy data with public URLs)
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        // For backward compatibility, try to extract the path from public URL
        // or use the URL directly if it's from before the migration
        const match = filePath.match(/\/storage\/v1\/object\/public\/assets\/(.+)$/);
        if (match) {
          const extractedPath = match[1];
          setLoading(true);
          try {
            const { data, error } = await supabase.storage
              .from('assets')
              .createSignedUrl(extractedPath, 3600); // 1 hour expiry

            if (error) throw error;
            setSignedUrl(data.signedUrl);
          } catch {
            // Fallback to original URL if signed URL fails
            setSignedUrl(filePath);
          } finally {
            setLoading(false);
          }
        } else {
          // Use URL as-is if we can't extract the path
          setSignedUrl(filePath);
        }
        return;
      }

      // Generate signed URL for file path
      setLoading(true);
      try {
        const { data, error } = await supabase.storage
          .from('assets')
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (error) throw error;
        setSignedUrl(data.signedUrl);
      } catch (error) {
        console.error('Failed to generate signed URL:', error);
        setSignedUrl(null);
      } finally {
        setLoading(false);
      }
    };

    generateSignedUrl();
  }, [filePath]);

  return { signedUrl, loading };
};

/**
 * Helper function to generate a signed URL for a file path.
 * Use this for one-off URL generation (e.g., in forms).
 */
export const getSignedUrl = async (filePath: string | null | undefined): Promise<string | null> => {
  if (!filePath) return null;

  // Check if it's already a full URL (legacy data)
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    const match = filePath.match(/\/storage\/v1\/object\/public\/assets\/(.+)$/);
    if (match) {
      const extractedPath = match[1];
      try {
        const { data, error } = await supabase.storage
          .from('assets')
          .createSignedUrl(extractedPath, 3600);

        if (error) throw error;
        return data.signedUrl;
      } catch {
        return filePath;
      }
    }
    return filePath;
  }

  try {
    const { data, error } = await supabase.storage
      .from('assets')
      .createSignedUrl(filePath, 3600);

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error('Failed to generate signed URL:', error);
    return null;
  }
};
