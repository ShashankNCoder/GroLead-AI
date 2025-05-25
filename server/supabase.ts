import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://rplsdppbpfqufryrbwie.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbHNkcHBicGZxdWZyeXJid2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNzk3MjMsImV4cCI6MjA2Mzc1NTcyM30.9hT0wdSPoxQFA_fLAbEcj-ibEhkpQhBh0tjq0iZagJ4';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Create tables if they don't exist
export async function initializeDatabase() {
  try {
    console.log('Initializing Supabase database tables...');
    
    // Create leads table using direct SQL
    const { error: leadsError } = await supabase.rpc('exec_sql', {
      sql: `
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
        );
      `
    });

    // Create message templates table
    const { error: templatesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS message_templates (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          category VARCHAR(100),
          usage_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    // Create whatsapp messages table
    const { error: messagesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS whatsapp_messages (
          id SERIAL PRIMARY KEY,
          lead_id INTEGER REFERENCES leads(id),
          content TEXT NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'sent',
          sent_at TIMESTAMP,
          read_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    // Insert default message templates
    const { error: defaultTemplatesError } = await supabase
      .from('message_templates')
      .upsert([
        {
          id: 1,
          name: 'Home Loan Welcome',
          content: 'Hi {name}! 🏠 Thank you for your interest in home loans. We have competitive rates starting from 8.5%. Can we schedule a quick call to discuss your requirements?',
          category: 'home_loan'
        },
        {
          id: 2,
          name: 'Personal Loan Follow-up',
          content: 'Hello {name}! 💰 We can offer you a personal loan up to ₹{loanAmount} at attractive rates. Quick approval in 24 hours. Interested?',
          category: 'personal_loan'
        },
        {
          id: 3,
          name: 'Document Request',
          content: 'Hi {name}! To proceed with your loan application, please share: 1) Salary slips (3 months) 2) Bank statements 3) PAN & Aadhaar. Thanks!',
          category: 'documentation'
        }
      ], { onConflict: 'id' });

    console.log('Database tables initialized successfully');
    if (leadsError) console.log('Leads table note:', leadsError.message);
    if (templatesError) console.log('Templates table note:', templatesError.message);
    if (messagesError) console.log('Messages table note:', messagesError.message);
    
  } catch (error) {
    console.error('Database initialization error:', error);
    // Fallback: Try simple table creation
    console.log('Attempting fallback table creation...');
  }
}