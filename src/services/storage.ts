import { supabase } from './supabase';

export type PublicBucket = 'avatars' | 'portfolio' | 'reviews';
export type PrivateBucket = 'kyc' | 'chat';

/**
 * Uploads a local file URI (from expo-image-picker) to Supabase Storage.
 * Paths must start with the uploader's user id (or booking id for chat) — enforced by storage RLS.
 */
export async function uploadImage(
  bucket: PublicBucket | PrivateBucket,
  path: string,
  uri: string,
  contentType = 'image/jpeg',
): Promise<string> {
  const body = await (await fetch(uri)).arrayBuffer();
  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType, upsert: true });
  if (error) throw new Error(error.message);
  return path;
}

export function publicUrl(bucket: PublicBucket, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function signedUrl(bucket: PrivateBucket, path: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
