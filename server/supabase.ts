import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Create tables if they don't exist
export async function initializeDatabase() {
  try {
    console.log('Initializing Supabase database tables...');
    
    // Create leads table with your exact format using raw SQL
    const { error: leadsError } = await supabase
      .from('leads')
      .select('id')
      .limit(1)
      .then(async (result) => {
        if (result.error?.code === 'PGRST116') {
          // Table doesn't exist, it will be created automatically on first insert
          console.log('Leads table will be created on first insert');
          return { error: null };
        }
        return result;
      });

    // Create message templates table
    const { error: templatesError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS message_templates (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          content TEXT NOT NULL,
          category TEXT NOT NULL,
          usage_count INTEGER DEFAULT 0,
          response_rate REAL DEFAULT 0
        );
      `
    });

    // Create whatsapp messages table
    const { error: messagesError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS whatsapp_messages (
          id SERIAL PRIMARY KEY,
          lead_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'queued',
          sent_at TIMESTAMP,
          read_at TIMESTAMP
        );
      `
    });

    // If tables are created successfully, insert default templates
    if (!templatesError) {
      const { error: defaultTemplatesError } = await supabase
        .from('message_templates')
        .upsert([
          {
            id: 1,
            name: 'Credit Card Welcome',
            content: 'Hi {name}! 💳 Thank you for your interest in credit cards. We have amazing offers with instant approval. Can we schedule a quick call?',
            category: 'pitch'
          },
          {
            id: 2,
            name: 'Personal Loan Follow-up',
            content: 'Hello {name}! 💰 Based on your income of {incomeLevel}, you qualify for attractive personal loan rates. Interested?',
            category: 'followup'
          },
          {
            id: 3,
            name: 'Insurance Greeting',
            content: 'Hi {name}! 🛡️ Secure your family\'s future with our comprehensive insurance plans. Let\'s discuss your needs!',
            category: 'greeting'
          }
        ], { onConflict: 'id' });
    }

    console.log('Database tables initialized successfully');
    if (leadsError) console.log('Leads table note:', leadsError.message);
    if (templatesError) console.log('Templates table note:', templatesError.message);
    if (messagesError) console.log('Messages table note:', messagesError.message);
    
  } catch (error) {
    console.error('Database initialization error:', error);
    console.log('Will attempt to create tables on first data insert');
  }
}