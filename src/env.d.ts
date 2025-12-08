/// <reference types="astro/client" />

import type { SupabaseClient } from "./db/supabase.client.ts";

// Cloudflare runtime environment variables
export interface RuntimeEnv {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  OPENROUTER_CACHE_TTL?: string;
  ENABLE_AI_MOTIVATION?: string;
}

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      user?: {
        id: string;
        email: string;
      };
      // Runtime environment (from Cloudflare or import.meta.env)
      runtime?: {
        env: RuntimeEnv;
      };
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
  readonly OPENROUTER_API_KEY?: string;
  readonly OPENROUTER_MODEL?: string;
  readonly OPENROUTER_CACHE_TTL?: string;
  readonly ENABLE_AI_MOTIVATION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
