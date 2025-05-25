import { supabase } from './supabase';
import type { IStorage } from './storage';
import type { User, InsertUser, Lead, InsertLead, MessageTemplate, InsertMessageTemplate, WhatsappMessage, InsertWhatsappMessage } from '../shared/schema';

export class SupabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) return undefined;
    return data;
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return data;
  }

  // Leads
  async getAllLeads(): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch leads: ${error.message}`);
    return data.map(this.transformLeadFromDb);
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return this.transformLeadFromDb(data);
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const dbLead = this.transformLeadToDb(lead);
    const { data, error } = await supabase
      .from('leads')
      .insert(dbLead)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create lead: ${error.message}`);
    return this.transformLeadFromDb(data);
  }

  async updateLead(id: number, updates: Partial<Lead>): Promise<Lead | undefined> {
    const dbUpdates = this.transformLeadToDb(updates);
    const { data, error } = await supabase
      .from('leads')
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) return undefined;
    return this.transformLeadFromDb(data);
  }

  async deleteLead(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  async getLeadsByStatus(status: string): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch leads by status: ${error.message}`);
    return data.map(this.transformLeadFromDb);
  }

  async updateLeadStatus(id: number, status: string): Promise<Lead | undefined> {
    return this.updateLead(id, { status });
  }

  // Message Templates
  async getAllMessageTemplates(): Promise<MessageTemplate[]> {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch templates: ${error.message}`);
    return data.map(this.transformTemplateFromDb);
  }

  async getMessageTemplate(id: number): Promise<MessageTemplate | undefined> {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return this.transformTemplateFromDb(data);
  }

  async createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate> {
    const dbTemplate = this.transformTemplateToDb(template);
    const { data, error } = await supabase
      .from('message_templates')
      .insert(dbTemplate)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create template: ${error.message}`);
    return this.transformTemplateFromDb(data);
  }

  async updateMessageTemplate(id: number, updates: Partial<MessageTemplate>): Promise<MessageTemplate | undefined> {
    const dbUpdates = this.transformTemplateToDb(updates);
    const { data, error } = await supabase
      .from('message_templates')
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) return undefined;
    return this.transformTemplateFromDb(data);
  }

  async deleteMessageTemplate(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  // WhatsApp Messages
  async getAllWhatsappMessages(): Promise<WhatsappMessage[]> {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch messages: ${error.message}`);
    return data.map(this.transformMessageFromDb);
  }

  async getWhatsappMessagesByLead(leadId: number): Promise<WhatsappMessage[]> {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch messages: ${error.message}`);
    return data.map(this.transformMessageFromDb);
  }

  async createWhatsappMessage(message: InsertWhatsappMessage): Promise<WhatsappMessage> {
    const dbMessage = this.transformMessageToDb(message);
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .insert(dbMessage)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create message: ${error.message}`);
    return this.transformMessageFromDb(data);
  }

  async updateWhatsappMessage(id: number, updates: Partial<WhatsappMessage>): Promise<WhatsappMessage | undefined> {
    const dbUpdates = this.transformMessageToDb(updates);
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) return undefined;
    return this.transformMessageFromDb(data);
  }

  // Transform methods to handle field name differences
  private transformLeadFromDb(dbLead: any): Lead {
    return {
      id: dbLead.id,
      name: dbLead.name,
      phone: dbLead.phone,
      email: dbLead.email,
      city: dbLead.city,
      product: dbLead.product,
      loanAmount: dbLead.loan_amount,
      monthlyIncome: dbLead.monthly_income,
      employmentType: dbLead.employment_type,
      creditScore: dbLead.credit_score,
      source: dbLead.source,
      status: dbLead.status,
      whatsappStatus: dbLead.whatsapp_status,
      aiScore: dbLead.ai_score,
      aiReason: dbLead.ai_reason,
      aiType: dbLead.ai_type,
      bestContactTime: dbLead.best_contact_time,
      lastContacted: dbLead.last_contacted ? new Date(dbLead.last_contacted) : null,
      createdAt: new Date(dbLead.created_at),
      updatedAt: new Date(dbLead.updated_at)
    };
  }

  private transformLeadToDb(lead: Partial<Lead | InsertLead>): any {
    const dbLead: any = {};
    if (lead.name !== undefined) dbLead.name = lead.name;
    if (lead.phone !== undefined) dbLead.phone = lead.phone;
    if (lead.email !== undefined) dbLead.email = lead.email;
    if (lead.city !== undefined) dbLead.city = lead.city;
    if (lead.product !== undefined) dbLead.product = lead.product;
    if (lead.loanAmount !== undefined) dbLead.loan_amount = lead.loanAmount;
    if (lead.monthlyIncome !== undefined) dbLead.monthly_income = lead.monthlyIncome;
    if (lead.employmentType !== undefined) dbLead.employment_type = lead.employmentType;
    if (lead.creditScore !== undefined) dbLead.credit_score = lead.creditScore;
    if (lead.source !== undefined) dbLead.source = lead.source;
    if (lead.status !== undefined) dbLead.status = lead.status;
    if (lead.whatsappStatus !== undefined) dbLead.whatsapp_status = lead.whatsappStatus;
    if (lead.aiScore !== undefined) dbLead.ai_score = lead.aiScore;
    if (lead.aiReason !== undefined) dbLead.ai_reason = lead.aiReason;
    if (lead.aiType !== undefined) dbLead.ai_type = lead.aiType;
    if (lead.bestContactTime !== undefined) dbLead.best_contact_time = lead.bestContactTime;
    if (lead.lastContacted !== undefined) dbLead.last_contacted = lead.lastContacted?.toISOString();
    return dbLead;
  }

  private transformTemplateFromDb(dbTemplate: any): MessageTemplate {
    return {
      id: dbTemplate.id,
      name: dbTemplate.name,
      content: dbTemplate.content,
      category: dbTemplate.category,
      usageCount: dbTemplate.usage_count,
      createdAt: new Date(dbTemplate.created_at),
      updatedAt: new Date(dbTemplate.updated_at)
    };
  }

  private transformTemplateToDb(template: Partial<MessageTemplate | InsertMessageTemplate>): any {
    const dbTemplate: any = {};
    if (template.name !== undefined) dbTemplate.name = template.name;
    if (template.content !== undefined) dbTemplate.content = template.content;
    if (template.category !== undefined) dbTemplate.category = template.category;
    if (template.usageCount !== undefined) dbTemplate.usage_count = template.usageCount;
    return dbTemplate;
  }

  private transformMessageFromDb(dbMessage: any): WhatsappMessage {
    return {
      id: dbMessage.id,
      leadId: dbMessage.lead_id,
      content: dbMessage.content,
      status: dbMessage.status,
      sentAt: dbMessage.sent_at ? new Date(dbMessage.sent_at) : null,
      readAt: dbMessage.read_at ? new Date(dbMessage.read_at) : null,
      createdAt: new Date(dbMessage.created_at)
    };
  }

  private transformMessageToDb(message: Partial<WhatsappMessage | InsertWhatsappMessage>): any {
    const dbMessage: any = {};
    if (message.leadId !== undefined) dbMessage.lead_id = message.leadId;
    if (message.content !== undefined) dbMessage.content = message.content;
    if (message.status !== undefined) dbMessage.status = message.status;
    if (message.sentAt !== undefined) dbMessage.sent_at = message.sentAt?.toISOString();
    if (message.readAt !== undefined) dbMessage.read_at = message.readAt?.toISOString();
    return dbMessage;
  }
}