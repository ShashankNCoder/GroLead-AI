import type { Express } from "express";
import { createServer, type Server } from "http";
import { suggestTemplateContent } from './ai';
import { WhatsAppService } from './whatsapp';
import { supabase } from './supabase';
if (!supabase) {
  throw new Error('Supabase client is not properly initialized');
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Analytics API Endpoint - Register this first
  app.get('/api/analytics', async (req, res) => {
    try {
      const { user_id } = req.query;
      
      if (!user_id) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Get AI scoring results for the last 7 weeks
      const { data: aiScoringResults, error: scoringError } = await supabase
        .from('ai_scoring_results')
        .select('*')
        .eq('user_id', user_id)
        .gte('created_at', new Date(Date.now() - 7 * 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (scoringError) {
        throw scoringError;
      }

      // Process the data to get weekly totals
      const weeklyData = new Map();
      const now = new Date();

      // Initialize the last 7 weeks
      for (let i = 0; i < 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (6 - i) * 7);
        const weekKey = date.toISOString().split('T')[0];
        weeklyData.set(weekKey, {
          week: `Week ${i + 1}`,
          total: 0,
          highPriority: 0
        });
      }

      // Fill in the data
      aiScoringResults?.forEach(result => {
        const date = new Date(result.created_at);
        const weekKey = date.toISOString().split('T')[0];
        const weekData = weeklyData.get(weekKey);
        
        if (weekData) {
          weekData.total++;
          if (result.score >= 70) {
            weekData.highPriority++;
          }
        }
      });

      // Convert to array and sort by week
      const aiScoredLeads = Array.from(weeklyData.values());

      // Get lead source data
      const { data: leadSourceData, error: sourceError } = await supabase
        .from('leads')
        .select('source')
        .eq('user_id', user_id);

      if (sourceError) {
        throw sourceError;
      }

      // Process lead source data
      const sourceCounts = new Map();
      leadSourceData?.forEach(lead => {
        const source = lead.source || 'Unknown';
        sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
      });

      const totalLeads = leadSourceData?.length || 0;
      const processedSourceData = Array.from(sourceCounts.entries()).map(([name, count]) => ({
        name,
        value: Math.round((count / totalLeads) * 100),
        color: getSourceColor(name)
      }));

      // Get leads conversion data
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('created_at, status')
        .eq('user_id', user_id)
        .gte('created_at', new Date(Date.now() - 7 * 7 * 24 * 60 * 60 * 1000).toISOString());

      if (leadsError) {
        throw leadsError;
      }

      // Process leads conversion data
      const conversionData = new Map();
      leadsData?.forEach(lead => {
        const date = new Date(lead.created_at);
        const weekKey = date.toISOString().split('T')[0];
        const weekData = conversionData.get(weekKey) || { added: 0, converted: 0 };
        weekData.added++;
        if (lead.status === 'converted') {
          weekData.converted++;
        }
        conversionData.set(weekKey, weekData);
      });

      const leadsConversionData = Array.from(conversionData.entries()).map(([week, data]) => ({
        week,
        ...data
      }));

      res.json({
        aiScoredLeads,
        leadsConversionData,
        leadSourceData: processedSourceData,
        topProductsData: [] // Keep this empty for now
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
  });

  // Helper function to get consistent colors for lead sources
  function getSourceColor(source: string): string {
    const colors: { [key: string]: string } = {
      'Website': '#3B82F6',
      'Referral': '#10B981',
      'Social Media': '#F59E0B',
      'Email': '#EF4444',
      'Phone': '#8B5CF6',
      'Other': '#6B7280',
      'Unknown': '#9CA3AF'
    };
    return colors[source] || colors['Other'];
  }

  // WhatsApp messaging endpoints
  app.post("/api/whatsapp/send", async (req, res) => {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "No messages to send" });
    }

      const whatsappService = WhatsAppService.getInstance();
    const results = [];

    for (const msg of messages) {
      // Defensive: ensure phoneNumber and message are present and strings
      if (!msg.phoneNumber || !msg.message) {
        console.error("Skipping message due to missing phoneNumber or message", msg);
        results.push({ phoneNumber: msg.phoneNumber, error: "Missing phoneNumber or message" });
        continue;
      }
      const to = String(msg.phoneNumber).trim();
      const body = String(msg.message).trim();
      const attachments = Array.isArray(msg.attachments) ? msg.attachments : [];
      
      if (!to || !body) {
        console.error("Skipping message due to empty phoneNumber or message", { to, body });
        results.push({ phoneNumber: to, error: "Empty phoneNumber or message" });
        continue;
      }
      try {
        const result = await whatsappService.sendMessage(to, body);
        // Handle both single message and multiple message responses
        const results = Array.isArray(result) ? result : [result];
        results.push({ phoneNumber: to, result: results });
      } catch (error: any) {
        results.push({ phoneNumber: to, error: error.message || error });
    }
    }

    res.json({ results });
  });

  app.post("/api/whatsapp/template", async (req, res) => {
    try {
      const { phoneNumber, templateName, parameters } = req.body;
      const whatsappService = WhatsAppService.getInstance();
      const result = await whatsappService.sendTemplate(phoneNumber, templateName, parameters);
      res.json(result);
    } catch (error) {
      console.error('Error in WhatsApp template route:', error);
      res.status(500).json({ error: 'Failed to send WhatsApp template' });
    }
  });

  app.get("/api/whatsapp/status/:messageId", async (req, res) => {
    try {
      const { messageId } = req.params;
      const whatsappService = WhatsAppService.getInstance();
      const result = await whatsappService.getMessageStatus(messageId);
      res.json(result);
    } catch (error) {
      console.error('Error in WhatsApp status route:', error);
      res.status(500).json({ error: 'Failed to get message status' });
    }
  });

  // AI Template Suggestion Endpoint
  app.post("/api/ai/suggest-template", async (req, res) => {
    try {
      const { name, category } = req.body;
      if (!name || !category) {
        return res.status(400).json({ error: "Missing name or category" });
      }
      const suggestion = await suggestTemplateContent({ name, category });
      if (!suggestion) {
        return res.status(500).json({ error: "No suggestion returned from OpenAI" });
      }
      res.json({ suggestion });
    } catch (error: any) {
      console.error("AI template suggestion error:", error);
      res.status(500).json({ error: error?.message || "Failed to get AI suggestion" });
    }
  });

  // AI Lead Scoring Batch Endpoint (refactored to accept full lead data)
  app.post('/api/ai/score-leads-batch', async (req, res) => {
    try {
      const { user_id, leads } = req.body;
      
      if (!user_id || !leads || !Array.isArray(leads)) {
        console.log('Invalid request parameters');
        return res.status(400).json({ 
          success: false,
          error: 'Invalid request parameters' 
        });
      }

      // Score each lead
      const { scoreLeadWithAI } = await import('./ai');
      const scoringResults = [];
      const errors = [];

      for (const lead of leads) {
        try {
          const scoring = await scoreLeadWithAI(lead);

          // Sanitize and validate data
          let actions = scoring.suggestedActions;
          if (!Array.isArray(actions)) {
            actions = typeof actions === 'string' ? [actions] : [];
          }
          actions = actions.map(String);

          let bestContactTime = scoring.bestContactTime;
          if (bestContactTime && !isNaN(Date.parse(bestContactTime))) {
            bestContactTime = new Date(bestContactTime).toISOString();
          } else {
            bestContactTime = '';
          }
          let textMessagePoints = scoring.textMessagePoints;
          if (textMessagePoints) {
            textMessagePoints = JSON.parse(JSON.stringify(textMessagePoints));
          }
          let callTalkingPoints = scoring.callTalkingPoints;
          if (callTalkingPoints) {
            callTalkingPoints = JSON.parse(JSON.stringify(callTalkingPoints));
          }

          // Store scoring results in ai_scoring_results table
          const { data: scoringResult, error: insertError } = await supabase
            .from('ai_scoring_results')
            .insert({
              user_id,
              lead_id: lead.id,
              lead_name: lead.name,
              product: lead.productInterested || lead.product,
              score: scoring.score,
              ai_reasoning: scoring.reason,
              best_contact_time: bestContactTime || '',
              suggested_actions: actions,
              text_message_points: textMessagePoints,
              call_talking_points: callTalkingPoints
            })
            .select()
            .single();

          if (insertError) {
            errors.push({
              lead_id: lead.id,
              error: 'Failed to store scoring result',
              details: insertError
            });
            continue;
          }

          scoringResults.push({
            id: lead.id,
            name: lead.name,
            score: scoring.score,
            reason: scoring.reason,
            bestContactTime: bestContactTime || '',
            suggestedActions: actions,
            textMessagePoints: textMessagePoints,
            callTalkingPoints: callTalkingPoints
          });
        } catch (leadError) {
          console.error('Error scoring lead:', lead.id, leadError);
          errors.push({
            lead_id: lead.id,
            error: (leadError as Error).message || 'Failed to score lead'
          });
        }
      }

      res.json({ 
        success: true, 
        message: 'Leads scored successfully',
        results: scoringResults,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Error in batch scoring:', error);
      res.status(500).json({ 
        success: false,
        error: (error as Error).message || 'Failed to score leads'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
