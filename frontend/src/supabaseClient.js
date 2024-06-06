// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmqibtzexuxanyouwpch.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttcWlidHpleHV4YW55b3V3cGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc2NTg5NTcsImV4cCI6MjAzMzIzNDk1N30.UwgnTszySD7myAXl48pSaQmAW06jTa7lhEwowv0IAqU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const logout = async () => {
  await supabase.auth.signOut();
};