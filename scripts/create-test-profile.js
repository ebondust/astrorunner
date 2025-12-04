#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Load .env.test
dotenv.config({ path: path.join(rootDir, '.env.test') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const testUserId = process.env.E2E_USERNAME_ID;

if (!supabaseUrl || !supabaseKey || !testUserId) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestProfile() {
  console.log(`Creating profile for user: ${testUserId}`);

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ user_id: testUserId, distance_unit: 'km' }, { onConflict: 'user_id' })
    .select();

  if (error) {
    console.error('Error creating profile:', error.message);
    process.exit(1);
  }

  console.log('Profile created successfully:', data);
}

createTestProfile();
