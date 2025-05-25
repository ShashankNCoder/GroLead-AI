import type { Express } from "express";
import { createServer, type Server } from "http";
import { SupabaseStorage } from "./supabase-storage";
import { whatsappAPI, documentOCR, webScraper, aiLeadScoring } from "./api-integrations";
import { insertLeadSchema, insertMessageTemplateSchema } from "@shared/schema";
import { scoreLeadWithAI } from "./openai";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Leads endpoints
  app.get("/api/leads", async (req, res) => {
    try {
      const leads = await storage.getAllLeads();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const leadData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(leadData);
      res.json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid lead data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create lead" });
      }
    }
  });

  app.put("/api/leads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const lead = await storage.updateLead(id, updates);
      if (!lead) {
        res.status(404).json({ error: "Lead not found" });
      } else {
        res.json(lead);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteLead(id);
      if (!success) {
        res.status(404).json({ error: "Lead not found" });
      } else {
        res.json({ success: true });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lead" });
    }
  });

  // Lead scoring endpoint
  app.post("/api/leads/:id/score", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const lead = await storage.getLead(id);
      
      if (!lead) {
        res.status(404).json({ error: "Lead not found" });
        return;
      }

      const scoring = await scoreLeadWithAI(lead);
      const updatedLead = await storage.updateLead(id, {
        aiScore: scoring.score,
        aiReason: scoring.reason,
        aiType: scoring.type,
        bestContactTime: scoring.bestContactTime
      });

      res.json(updatedLead);
    } catch (error) {
      console.error("Lead scoring error:", error);
      res.status(500).json({ error: "Failed to score lead" });
    }
  });

  // Batch score all leads
  app.post("/api/leads/score-all", async (req, res) => {
    try {
      const leads = await storage.getAllLeads();
      const scoredLeads = [];

      for (const lead of leads) {
        if (lead.aiScore === 0 || lead.aiScore === null) {
          try {
            const scoring = await scoreLeadWithAI(lead);
            const updatedLead = await storage.updateLead(lead.id, {
              aiScore: scoring.score,
              aiReason: scoring.reason,
              aiType: scoring.type,
              bestContactTime: scoring.bestContactTime
            });
            if (updatedLead) scoredLeads.push(updatedLead);
          } catch (error) {
            console.error(`Failed to score lead ${lead.id}:`, error);
          }
        }
      }

      res.json({ scoredCount: scoredLeads.length, leads: scoredLeads });
    } catch (error) {
      console.error("Batch scoring error:", error);
      res.status(500).json({ error: "Failed to batch score leads" });
    }
  });

  // Message templates endpoints
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getAllMessageTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const templateData = insertMessageTemplateSchema.parse(req.body);
      const template = await storage.createMessageTemplate(templateData);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid template data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create template" });
      }
    }
  });

  // WhatsApp messaging endpoints
  app.post("/api/whatsapp/send", async (req, res) => {
    try {
      const { leadIds, message, templateId } = req.body;
      
      if (!leadIds || !Array.isArray(leadIds) || !message) {
        res.status(400).json({ error: "Invalid request data" });
        return;
      }

      const results = [];
      
      for (const leadId of leadIds) {
        try {
          // Create message record
          const whatsappMessage = await storage.createWhatsappMessage({
            leadId: parseInt(leadId),
            content: message,
            status: "sent"
          });

          // Update lead WhatsApp status
          await storage.updateLead(parseInt(leadId), {
            whatsappStatus: "sent",
            lastContacted: new Date()
          });

          // Update template usage if provided
          if (templateId) {
            const template = await storage.getMessageTemplate(parseInt(templateId));
            if (template) {
              await storage.updateMessageTemplate(parseInt(templateId), {
                usageCount: template.usageCount + 1
              });
            }
          }

          results.push({ leadId, status: "sent", messageId: whatsappMessage.id });
        } catch (error) {
          console.error(`Failed to send message to lead ${leadId}:`, error);
          results.push({ leadId, status: "failed", error: error.message });
        }
      }

      res.json({ results });
    } catch (error) {
      console.error("WhatsApp send error:", error);
      res.status(500).json({ error: "Failed to send WhatsApp messages" });
    }
  });

  // Analytics endpoint
  app.get("/api/analytics", async (req, res) => {
    try {
      const leads = await storage.getAllLeads();
      const messages = await storage.getAllWhatsappMessages();
      
      const stats = {
        leadsToday: leads.filter(lead => {
          const today = new Date().toDateString();
          return lead.lastContacted && new Date(lead.lastContacted).toDateString() === today;
        }).length,
        totalLeads: leads.length,
        convertedLeads: leads.filter(lead => lead.status === "converted").length,
        averageScore: Math.round(leads.reduce((sum, lead) => sum + (lead.aiScore || 0), 0) / leads.length) || 0,
        conversionRate: leads.length > 0 ? ((leads.filter(lead => lead.status === "converted").length / leads.length) * 100).toFixed(1) : "0.0",
        messagesSent: messages.filter(msg => msg.status === "sent" || msg.status === "delivered").length,
        messagesRead: messages.filter(msg => msg.readAt).length,
        leadsByStatus: {
          new: leads.filter(lead => lead.status === "new").length,
          contacted: leads.filter(lead => lead.status === "contacted").length,
          converted: leads.filter(lead => lead.status === "converted").length,
          dropped: leads.filter(lead => lead.status === "dropped").length
        },
        leadsByProduct: leads.reduce((acc, lead) => {
          acc[lead.product] = (acc[lead.product] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        leadsBySource: leads.reduce((acc, lead) => {
          acc[lead.source] = (acc[lead.source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      res.json(stats);
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
