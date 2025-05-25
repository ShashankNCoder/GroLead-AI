import OpenAI from "openai";
import type { Lead } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

interface LeadScoring {
  score: number;
  reason: string;
  type: string;
  bestContactTime: string;
}

export async function scoreLeadWithAI(lead: Lead): Promise<LeadScoring> {
  try {
    const prompt = `Analyze the following lead for a financial services company and provide a comprehensive scoring:

Lead Details:
- Name: ${lead.name}
- Phone: ${lead.phone}
- Email: ${lead.email || 'Not provided'}
- City: ${lead.city || 'Not provided'}
- Product Interest: ${lead.product}
- Loan Amount: ${lead.loanAmount || 'Not specified'}
- Monthly Income: ${lead.monthlyIncome || 'Not provided'}
- Employment Type: ${lead.employmentType || 'Not provided'}
- Additional Notes: ${lead.notes || 'None'}

Please analyze this lead and provide:
1. A score from 0-100 (higher = better prospect)
2. A detailed reason for the score (2-3 sentences)
3. A type classification: "hot" (80-100), "warm" (60-79), "cold" (40-59), or "low" (0-39)
4. Best contact time in format "HH:MM AM/PM - HH:MM AM/PM"

Consider factors like:
- Product suitability and loan amount reasonableness
- Income level vs loan requirements
- Employment stability
- Location factors
- Overall profile completeness

Respond in JSON format with keys: score, reason, type, bestContactTime`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert financial services lead scoring analyst. Provide accurate, actionable scoring based on lead quality indicators."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      score: Math.max(0, Math.min(100, Math.round(result.score || 0))),
      reason: result.reason || "AI analysis completed",
      type: result.type || "cold",
      bestContactTime: result.bestContactTime || "10:00 AM - 6:00 PM"
    };
  } catch (error) {
    console.error("OpenAI scoring error:", error);
    
    // Fallback scoring based on available data
    let score = 30; // Base score
    
    if (lead.monthlyIncome) score += 20;
    if (lead.email) score += 10;
    if (lead.employmentType) score += 15;
    if (lead.loanAmount) score += 15;
    if (lead.city) score += 10;
    
    const type = score >= 80 ? "hot" : score >= 60 ? "warm" : score >= 40 ? "cold" : "low";
    
    return {
      score,
      reason: "Basic scoring applied due to AI service unavailability. Manual review recommended.",
      type,
      bestContactTime: "10:00 AM - 6:00 PM"
    };
  }
}
