import { createClient } from '@supabase/supabase-js';

// Helper to clean quotes and whitespaces from environment variables
const sanitizeEnvVar = (val: any): string => {
  if (!val || typeof val !== 'string') return '';
  return val.trim().replace(/^['"]|['"]$/g, '').trim();
};

const sanitizeSupabaseUrl = (val: any): string => {
  let url = sanitizeEnvVar(val);
  if (!url) return '';
  // Remove trailing /rest/v1/ or /rest/v1 or trailing slashes
  url = url.replace(/\/rest\/v1\/?$/, '');
  url = url.replace(/\/+$/, '');
  return url;
};

// Retrieve environment variables using standard Vite syntax (ignored for TS compiler check)
// fallback to the default project in case they are not defined
// @ts-ignore
const rawUrl = import.meta.env?.VITE_SUPABASE_URL;
// @ts-ignore
const rawKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

const SUPABASE_URL = sanitizeSupabaseUrl(rawUrl) || 'https://qrlbcpsgmidkyimbqdrj.supabase.co';
const SUPABASE_ANON_KEY = sanitizeEnvVar(rawKey) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFybGJjcHNnbWlka3lpbWJxZHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MzM4MjAsImV4cCI6MjA5OTAwOTgyMH0.B19HNsWgsdXIEFWZbnsRi12rUiR9mN2noaUXFv3Na5c';

console.log('🔌 [Supabase Init] URL:', SUPABASE_URL);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
