import { pgTable, serial, text, varchar, integer, numeric, timestamp, boolean, json } from 'drizzle-orm/pg-core';

// AI Scoring Results Table
export const aiScoringResults = pgTable('ai_scoring_results', {
  id: serial('id').primaryKey(),
  leadId: integer('lead_id'),
  userId: text('user_id').notNull(),
  score: integer('score').notNull(),
  reason: text('reason').notNull(),
  bestContactTime: timestamp('best_contact_time'),
  suggestedActions: json('suggested_actions'),
  textMessagePoints: json('text_message_points'),
  callTalkingPoints: json('call_talking_points'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Leads Table
export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  pincode: varchar('pincode', { length: 10 }),
  productInterested: text('product_interested'),
  incomeLevel: text('income_level'),
  leadSource: text('lead_source'),
  lastContacted: timestamp('last_contacted'),
  contactMethod: text('contact_method'),
  numPastInteractions: integer('num_past_interactions').default(0),
  status: text('status').default('new'),
  shortNotes: text('short_notes'),
  latestScoringId: integer('latest_scoring_id').references(() => aiScoringResults.id),
  loanAmount: numeric('loan_amount'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  isActive: boolean('is_active').default(true),
  metadata: json('metadata')
});

// Templates Table
export const templates = pgTable('templates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'whatsapp', 'email', 'sms'
  content: text('content').notNull(),
  variables: json('variables'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Messages Table
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  leadId: integer('lead_id').references(() => leads.id),
  templateId: integer('template_id').references(() => templates.id),
  type: text('type').notNull(), // 'whatsapp', 'email', 'sms'
  content: text('content').notNull(),
  status: text('status').default('pending'), // 'pending', 'sent', 'failed'
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow(),
  metadata: json('metadata')
});

// Types for TypeScript
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type AIScoringResult = typeof aiScoringResults.$inferSelect;
export type NewAIScoringResult = typeof aiScoringResults.$inferInsert; 