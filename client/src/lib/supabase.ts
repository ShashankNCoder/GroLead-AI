import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Function to ensure message_templates table exists
export async function ensureMessageTemplatesTable() {
  try {
    // Check if table exists by trying to select from it
    const { error } = await supabase
      .from('message_templates')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error checking message_templates table:', error);
      // If table doesn't exist, create it
      const { error: createError } = await supabase.rpc('create_message_templates_table');
      if (createError) {
        console.error('Error creating message_templates table:', createError);
        throw createError;
      }
    }
  } catch (error) {
    console.error('Error ensuring message_templates table:', error);
    throw error;
  }
}

// Call this function when the app initializes
ensureMessageTemplatesTable().catch(console.error); 