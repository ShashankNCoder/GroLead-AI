import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Create tables if they don't exist
export async function initializeDatabase() {
  try {
    // Create leads table
    const { error: leadsError } = await supabase.rpc('create_leads_table', {});
    if (leadsError && !leadsError.message.includes('already exists')) {
      console.log('Creating leads table...');
      await supabase.query(`
        CREATE TABLE IF NOT EXISTS leads (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          email VARCHAR(255),
          city VARCHAR(255),
          product VARCHAR(255) NOT NULL,
          loan_amount VARCHAR(255),
          monthly_income VARCHAR(255),
          employment_type VARCHAR(255),
          credit_score INTEGER,
          source VARCHAR(100) NOT NULL DEFAULT 'manual',
          status VARCHAR(50) NOT NULL DEFAULT 'new',
          whatsapp_status VARCHAR(50) DEFAULT 'not_contacted',
          ai_score INTEGER DEFAULT 0,
          ai_reason TEXT,
          ai_type VARCHAR(50),
          best_contact_time VARCHAR(100),
          last_contacted TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
    }

    // Create message templates table
    await supabase.query(`
      CREATE TABLE IF NOT EXISTS message_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(100),
        usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create whatsapp messages table
    await supabase.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id),
        content TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'sent',
        sent_at TIMESTAMP,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}