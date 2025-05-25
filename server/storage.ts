import { 
  users, leads, messageTemplates, whatsappMessages,
  type User, type InsertUser,
  type Lead, type InsertLead,
  type MessageTemplate, type InsertMessageTemplate,
  type WhatsappMessage, type InsertWhatsappMessage
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Leads
  getAllLeads(): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, updates: Partial<Lead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<boolean>;
  getLeadsByStatus(status: string): Promise<Lead[]>;
  updateLeadStatus(id: number, status: string): Promise<Lead | undefined>;

  // Message Templates
  getAllMessageTemplates(): Promise<MessageTemplate[]>;
  getMessageTemplate(id: number): Promise<MessageTemplate | undefined>;
  createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate>;
  updateMessageTemplate(id: number, updates: Partial<MessageTemplate>): Promise<MessageTemplate | undefined>;
  deleteMessageTemplate(id: number): Promise<boolean>;

  // WhatsApp Messages
  getAllWhatsappMessages(): Promise<WhatsappMessage[]>;
  getWhatsappMessagesByLead(leadId: number): Promise<WhatsappMessage[]>;
  createWhatsappMessage(message: InsertWhatsappMessage): Promise<WhatsappMessage>;
  updateWhatsappMessage(id: number, updates: Partial<WhatsappMessage>): Promise<WhatsappMessage | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private leads: Map<number, Lead>;
  private messageTemplates: Map<number, MessageTemplate>;
  private whatsappMessages: Map<number, WhatsappMessage>;
  private currentUserId: number;
  private currentLeadId: number;
  private currentTemplateId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.leads = new Map();
    this.messageTemplates = new Map();
    this.whatsappMessages = new Map();
    this.currentUserId = 1;
    this.currentLeadId = 1;
    this.currentTemplateId = 1;
    this.currentMessageId = 1;

    // Initialize with default templates
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates() {
    const defaultTemplates = [
      {
        name: "Home Loan Pitch",
        content: "Hi {name}! 👋\n\nI understand you're interested in a {product} for {loanAmount}.\n\nWe have some excellent offers with competitive interest rates. Would you like to schedule a quick call to discuss your requirements? 📞\n\nBest regards,\nGroMo Partner",
        category: "pitch"
      },
      {
        name: "Follow-up Message",
        content: "Hi {name}, just following up on your {product} inquiry. Do you have any questions I can help you with?\n\nLooking forward to hearing from you! 😊",
        category: "followup"
      },
      {
        name: "Document Request",
        content: "Hi {name}! To proceed with your {product} application, we'll need:\n\n📄 Salary slips (last 3 months)\n🏦 Bank statements (last 6 months)\n🆔 Identity proof\n\nPlease share these at your convenience.",
        category: "followup"
      }
    ];

    defaultTemplates.forEach(template => {
      const id = this.currentTemplateId++;
      this.messageTemplates.set(id, {
        id,
        ...template,
        usageCount: 0,
        responseRate: 0.75
      });
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Leads
  async getAllLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values()).sort((a, b) => b.id - a.id);
  }

  async getLead(id: number): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = this.currentLeadId++;
    const lead: Lead = {
      ...insertLead,
      id,
      aiScore: 0,
      aiReason: null,
      aiType: null,
      bestContactTime: null,
      lastContacted: null
    };
    this.leads.set(id, lead);
    return lead;
  }

  async updateLead(id: number, updates: Partial<Lead>): Promise<Lead | undefined> {
    const lead = this.leads.get(id);
    if (!lead) return undefined;

    const updatedLead = { ...lead, ...updates };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  async deleteLead(id: number): Promise<boolean> {
    return this.leads.delete(id);
  }

  async getLeadsByStatus(status: string): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(lead => lead.status === status);
  }

  async updateLeadStatus(id: number, status: string): Promise<Lead | undefined> {
    return this.updateLead(id, { status });
  }

  // Message Templates
  async getAllMessageTemplates(): Promise<MessageTemplate[]> {
    return Array.from(this.messageTemplates.values());
  }

  async getMessageTemplate(id: number): Promise<MessageTemplate | undefined> {
    return this.messageTemplates.get(id);
  }

  async createMessageTemplate(insertTemplate: InsertMessageTemplate): Promise<MessageTemplate> {
    const id = this.currentTemplateId++;
    const template: MessageTemplate = {
      ...insertTemplate,
      id,
      usageCount: 0,
      responseRate: 0
    };
    this.messageTemplates.set(id, template);
    return template;
  }

  async updateMessageTemplate(id: number, updates: Partial<MessageTemplate>): Promise<MessageTemplate | undefined> {
    const template = this.messageTemplates.get(id);
    if (!template) return undefined;

    const updatedTemplate = { ...template, ...updates };
    this.messageTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteMessageTemplate(id: number): Promise<boolean> {
    return this.messageTemplates.delete(id);
  }

  // WhatsApp Messages
  async getAllWhatsappMessages(): Promise<WhatsappMessage[]> {
    return Array.from(this.whatsappMessages.values()).sort((a, b) => b.id - a.id);
  }

  async getWhatsappMessagesByLead(leadId: number): Promise<WhatsappMessage[]> {
    return Array.from(this.whatsappMessages.values())
      .filter(message => message.leadId === leadId)
      .sort((a, b) => b.id - a.id);
  }

  async createWhatsappMessage(insertMessage: InsertWhatsappMessage): Promise<WhatsappMessage> {
    const id = this.currentMessageId++;
    const message: WhatsappMessage = {
      ...insertMessage,
      id,
      sentAt: null,
      readAt: null
    };
    this.whatsappMessages.set(id, message);
    return message;
  }

  async updateWhatsappMessage(id: number, updates: Partial<WhatsappMessage>): Promise<WhatsappMessage | undefined> {
    const message = this.whatsappMessages.get(id);
    if (!message) return undefined;

    const updatedMessage = { ...message, ...updates };
    this.whatsappMessages.set(id, updatedMessage);
    return updatedMessage;
  }
}

export const storage = new MemStorage();
