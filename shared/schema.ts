import { pgTable, text, serial, integer, boolean, timestamp, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  product: text("product").notNull(),
  incomeLevel: text("income_level"),
  source: text("source").notNull().default("manual"), // manual, csv, ocr, scraper
  lastContacted: timestamp("last_contacted"),
  contactMethod: text("contact_method"), // WhatsApp, Phone, In-Person
  pastInteractions: integer("past_interactions").default(0),
  status: text("status").notNull().default("new"), // new, contacted, converted, dropped
  notes: text("notes"),
  whatsappStatus: text("whatsapp_status").default("not_sent"), // not_sent, sent, read, replied
  aiScore: integer("ai_score").default(0),
  aiReason: text("ai_reason"),
  aiType: text("ai_type"), // hot, warm, cold, low
  bestContactTime: text("best_contact_time"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messageTemplates = pgTable("message_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // pitch, followup, greeting, upsell
  usageCount: integer("usage_count").default(0),
  responseRate: real("response_rate").default(0),
});

export const whatsappMessages = pgTable("whatsapp_messages", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("queued"), // queued, sent, delivered, read, failed
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  aiScore: true,
  aiReason: true,
  aiType: true,
  bestContactTime: true,
  lastContacted: true,
});

export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({
  id: true,
  usageCount: true,
  responseRate: true,
});

export const insertWhatsappMessageSchema = createInsertSchema(whatsappMessages).omit({
  id: true,
  sentAt: true,
  readAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;

export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = z.infer<typeof insertWhatsappMessageSchema>;
