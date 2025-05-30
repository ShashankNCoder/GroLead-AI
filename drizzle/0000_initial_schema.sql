-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  city TEXT,
  state TEXT,
  pincode VARCHAR(10),
  product_interested TEXT,
  income_level TEXT,
  lead_source TEXT,
  last_contacted TIMESTAMP,
  contact_method TEXT,
  num_past_interactions INTEGER DEFAULT 0,
  status TEXT DEFAULT 'new',
  short_notes TEXT,
  loan_amount NUMERIC,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB
);

-- Create templates table
CREATE TABLE IF NOT EXISTS public.templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  variables JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES public.leads(id),
  template_id INTEGER REFERENCES public.templates(id),
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON public.messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(status);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON public.templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 