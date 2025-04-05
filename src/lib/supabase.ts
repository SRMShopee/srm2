import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Create admin client with service role key for server-side operations
export const supabaseAdmin = process.env.SUPABASE_SERVICE_KEY
  ? createClient<Database>(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY,
    )
  : null;
