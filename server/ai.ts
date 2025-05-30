import 'dotenv/config';
import OpenAI from "openai";
import { type Lead } from "./schema";

// Check for required environment variables
const requiredEnvVars = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};

// Validate all required environment variables
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(', ')}. ` +
    'Please add them to your .env file.'
  );
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 30000, // 30 seconds
});

interface ScoringResult {
  score: number;
  reason: string;
  bestContactTime: string;
  suggestedActions: string[];
  textMessagePoints: {
    keyPoints: string[];
    tone: string;
    avoidMentioning: string[];
    closing: string;
  };
  callTalkingPoints: {
    opening: string;
    keyTopics: string[];
    objectionHandling: string[];
    closing: string;
  };
}

export async function scoreLeadWithAI(lead: Lead): Promise<ScoringResult> {
  try {
    const now = new Date();
    const lastContacted = lead.lastContacted ? new Date(lead.lastContacted) : null;
    
    const prompt = `As an expert lead scoring AI, analyze this lead and provide a comprehensive scoring and recommendations:

Lead Information:
Name: ${lead.name}
Product Interested: ${lead.productInterested}
Phone: ${lead.phone}
Email: ${lead.email}
Address: ${lead.address}
City: ${lead.city}
State: ${lead.state}
Pincode: ${lead.pincode}
Income Level: ${lead.incomeLevel}
Lead Source: ${lead.leadSource}
Last Contacted: ${lastContacted ? lastContacted.toISOString() : 'Never'}
Contact Method: ${lead.contactMethod}
Past Interactions: ${lead.numPastInteractions}
Status: ${lead.status}
Notes: ${lead.shortNotes}

Current Time: ${now.toISOString()}

Please analyze this lead and provide:
1. A score from 0-100 based on the following criteria:
   - Financial capacity (50 points) - Based on Indian salary ranges:
     * ₹50,000 - ₹1,00,000 per month: 40-50 points
     * ₹25,000 - ₹49,999 per month: 30-40 points
     * Below ₹25,000 per month: 20-35 points
     * Consider employment type (salaried, self-employed, business owner)

   - Engagement history (20 points)
     * Multiple positive interactions: 15-20 points
     * Some engagement: 8-14 points
     * No engagement: 0-7 points

   - Contact information quality (20 points)
     * Complete contact details (phone, email, address): 15-20 points
     * Partial information: 8-14 points
     * Minimal information: 0-7 points


Rating Scale:
0-20: Very Low Priority (Income below ₹25,000, no engagement, minimal information)
21-40: Low Priority (Income ₹25,000-₹49,999, some engagement, partial information)
41-60: Medium Priority (Income ₹50,000-₹74,999, good engagement, complete information)
61-80: High Priority (Income ₹75,000-₹99,999, strong engagement, verified source)
81-100: Very High Priority (Income ₹1,00,000 and above, multiple positive interactions, trusted source)

Scoring Guidelines:
- A lead with income ₹1,00,000 and above, strong product interest, and multiple positive interactions should score 50-70
- A lead with income ₹25,000-₹75,000, moderate product interest, and some engagement should score 40-50
- A lead with income above ₹25,000, minimal product interest, and no engagement should score 20-30


2. Best time to contact (in Indian Standard Time - IST):
   - Must be between 6:00 AM and 8:00 PM IST
   - Format: "YYYY-MM-DD HH:mm" (24-hour format)
   - Consider the lead's employment type and location for optimal timing
   - For salaried professionals: suggest evening hours (6:00 PM - 8:00 PM)
   - For business owners: suggest morning hours (10:00 AM - 12:00 PM)
   - For others: suggest afternoon hours (2:00 PM - 4:00 PM)
   - Ensure the suggested time is at least 2 hours in the future

3. Detailed reasoning - Include specific analysis of:
   - Income level and its impact on scoring
   - Employment type and stability
   - Product interest and potential
   - Engagement history and responsiveness
   - Contact information completeness
   - Source reliability and trust factor

4. 3-5 specific recommended actions to take with this lead.
5. Text Message Points: Generate 2-4 specific, actionable message points that directly address the lead's interests and needs. Each point should be a concrete, personalized message that focuses on the lead's specific context (e.g., their product interest, location, or financial goals). Avoid generic phrases and focus on value-driven, action-oriented messages. Format as:
   {
     keyPoints: string[] (direct, personalized messages),
     tone: string (suggested tone, e.g. friendly, professional, helpful),
     avoidMentioning: string[] (topics to avoid in the message),
     closing: string (specific, action-oriented closing)
   }
6. Call Talking Points: Analyze the lead's data and generate 2-4 specific, actionable bullet points for a phone call. These should help the Gromo partner introduce themselves, address the lead's needs, handle likely objections, and close the call positively. Each point should be a direct phrase or question to use in the call. Format as:
   {
     opening: string (how to start the call, e.g. greeting and intro),
     keyTopics: string[] (main topics or questions to discuss, tailored to the lead),
     objectionHandling: string[] (phrases or strategies to address likely objections),
     closing: string (how to end the call on a positive note)
   }

Format the response as JSON with these fields:
{
  "score": number(0-100 based on criteria),
  "reason": string,
  "bestContactTime": string,
  "suggestedActions": string[],
  "textMessagePoints": {
    "keyPoints": string[],
    "tone": string,
    "avoidMentioning": string[generic topics to avoid],
    "closing": string
  },
  "callTalkingPoints": {
    "opening": string,
    "keyTopics": string[],
    "objectionHandling": string[],
    "closing": string
  }
}

`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert lead scoring AI specializing in financial services in India. Follow these strict guidelines:

1. Comprehensive Lead Analysis (100 points total):

   A. Financial Profile (70 points):
      - Income Level (50 points):
        * ₹1,00,000+ per month: 45-50 points
        * ₹25,000-₹75,000 per month: 35-45 points
        * Below ₹25,000 per month: 25-35 points
      - Employment Type (20 points):
        * Business Owner: 15-20 points
        * Salaried Professional: 10-15 points
        * Self-Employed: 5-10 points
        * Others: 0-5 points

   B. Lead Quality (30 points):
      - Product Interest (30 points):
        * High interest with specific requirements: 25-30 points
        * Moderate interest with general requirements: 15-25 points
        * Basic interest: 10-14 points


2. Final Score Interpretation:
   - 81-100: Premium Lead
     * High income (₹75,000+)
     * Strong product interest
     * Multiple positive interactions
     * Complete information
     * Trusted source
   
   - 61-80: High Potential Lead
     * Good income (₹50,000-₹74,999)
     * Clear product interest
     * Some positive interactions
     * Good information quality
     * Reliable source
   
   - 41-60: Medium Potential Lead
     * Moderate income (₹25,000-₹49,999)
     * Basic product interest
     * Limited interactions
     * Partial information
     * Standard source
   
   - 21-40: Low Potential Lead
     * Basic income (₹15,000-₹24,999)
     * Minimal product interest
     * No interactions
     * Incomplete information
     * Unknown source
   
   - 0-20: Very Low Potential Lead
     * Low income (below ₹15,000)
     * No product interest
     * No engagement
     * Minimal information
     * Unverified source

3. Best Contact Time Rules:
   - Must be in IST (Indian Standard Time)
   - Must be between 6:00 AM and 8:00 PM
   - Must be at least 2 hours in the future
   - Format: "YYYY-MM-DD HH:mm" (24-hour)
   - Consider employment type for timing:
     * Business owners: 10:00 AM - 12:00 PM
     * Salaried professionals: 6:00 PM - 8:00 PM
     * Others: 12:00 PM - 2:00 PM

4. Response Requirements:
   - Provide detailed analysis for each scoring component
   - Include specific examples from lead data
   - Explain how each factor affects the final score
   - Consider the lead's complete profile
   - Evaluate all available information
   - Provide actionable insights

5. Message Guidelines:
   - For textMessagePoints:
     * Reference specific lead details
     * Include personalized value propositions
     * Address actual needs and interests
     * Provide clear next steps
   
   - For callTalkingPoints:
     * Use lead's specific context
     * Include personalized opening
     * Address likely objections
     * Provide clear closing strategy

Remember: While income is important, consider the complete lead profile including employment type, location, engagement history, and information quality. All factors should be weighed appropriately in the final score.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1200
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    try {
      const result = JSON.parse(content);
      // Validate response format
      if (typeof result.score !== 'number' || 
          result.score < 0 || 
          result.score > 100 ||
          typeof result.reason !== 'string' || 
          typeof result.bestContactTime !== 'string' || 
          !Array.isArray(result.suggestedActions) ||
          result.suggestedActions.length < 3 ||
          result.suggestedActions.length > 5) {
        throw new Error("Invalid response format from OpenAI");
      }

      // Fallbacks for textMessagePoints
      const textMessagePoints = typeof result.textMessagePoints === 'object' && result.textMessagePoints !== null ? {
        keyPoints: Array.isArray(result.textMessagePoints.keyPoints) ? result.textMessagePoints.keyPoints : [],
        tone: typeof result.textMessagePoints.tone === 'string' ? result.textMessagePoints.tone : '',
        avoidMentioning: Array.isArray(result.textMessagePoints.avoidMentioning) ? result.textMessagePoints.avoidMentioning : [],
        closing: typeof result.textMessagePoints.closing === 'string' ? result.textMessagePoints.closing : ''
      } : { keyPoints: [], tone: '', avoidMentioning: [], closing: '' };

      // Fallbacks for callTalkingPoints
      const callTalkingPoints = typeof result.callTalkingPoints === 'object' && result.callTalkingPoints !== null ? {
        opening: typeof result.callTalkingPoints.opening === 'string' ? result.callTalkingPoints.opening : '',
        keyTopics: Array.isArray(result.callTalkingPoints.keyTopics) ? result.callTalkingPoints.keyTopics : [],
        objectionHandling: Array.isArray(result.callTalkingPoints.objectionHandling) ? result.callTalkingPoints.objectionHandling : [],
        closing: typeof result.callTalkingPoints.closing === 'string' ? result.callTalkingPoints.closing : ''
      } : { opening: '', keyTopics: [], objectionHandling: [], closing: '' };

      // Validate date format and ensure it's in the future and within allowed hours
      const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
      if (!dateRegex.test(result.bestContactTime)) {
        throw new Error("Invalid date format in bestContactTime");
      }

      // Convert the suggested time to a Date object
      const suggestedTime = new Date(result.bestContactTime);
      const now = new Date();

      // Add 2 hours to current time for minimum future time
      const minFutureTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));

      // Check if the time is in the future (at least 2 hours ahead)
      if (suggestedTime <= minFutureTime) {
        // If not in future, set to next available time slot
        const nextAvailableTime = new Date(minFutureTime);
        
        // Set to next available hour
        nextAvailableTime.setHours(nextAvailableTime.getHours() + 1);
        nextAvailableTime.setMinutes(0);
        nextAvailableTime.setSeconds(0);
        nextAvailableTime.setMilliseconds(0);

        // Ensure it's within allowed hours (6 AM to 8 PM)
        if (nextAvailableTime.getHours() < 6) {
          nextAvailableTime.setHours(6);
        } else if (nextAvailableTime.getHours() >= 20) {
          // If after 8 PM, set to next day at 6 AM
          nextAvailableTime.setDate(nextAvailableTime.getDate() + 1);
          nextAvailableTime.setHours(6);
        }

        // Format the new time
        result.bestContactTime = nextAvailableTime.toISOString().slice(0, 16).replace('T', ' ');
      }

      // Validate time is between 6 AM and 8 PM
      const hours = suggestedTime.getHours();
      if (hours < 6 || hours >= 20) {
        // Adjust to next available time slot
        const adjustedTime = new Date(suggestedTime);
        if (hours < 6) {
          adjustedTime.setHours(6);
        } else {
          adjustedTime.setDate(adjustedTime.getDate() + 1);
          adjustedTime.setHours(6);
        }
        adjustedTime.setMinutes(0);
        adjustedTime.setSeconds(0);
        adjustedTime.setMilliseconds(0);
        
        // Format the adjusted time
        result.bestContactTime = adjustedTime.toISOString().slice(0, 16).replace('T', ' ');
      }

      return {
        score: Math.round(result.score),
        reason: result.reason,
        bestContactTime: result.bestContactTime,
        suggestedActions: result.suggestedActions,
        textMessagePoints,
        callTalkingPoints
      };
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse AI response: ' + (parseError as Error).message);
    }
  } catch (error) {
    console.error('Error scoring lead with AI:', error);
    throw new Error('AI scoring failed: ' + ((error as Error)?.message || 'Unknown error'));
  }
}

export async function suggestTemplateContent({ name, category }: { name: string, category: string }): Promise<string> {
  try {
    const prompt = `Write a professional WhatsApp message template for the following:\nTemplate Name: ${name}\nCategory: ${category}\nThe message should be friendly, concise, and suitable for business communication. Use placeholders like {name}, {product}, {loanAmount}, {amount}, {city}, {income}, {employment} if relevant.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert at writing WhatsApp message templates for fintech companies. You are writing a message template for a fintech company that is trying to sell a product to a lead. The message should be friendly, concise, and suitable for business communication."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    return response.choices[0].message.content?.trim() || "";
  } catch (error: any) {
    console.error("OpenAI template suggestion error:", error?.response?.data || error?.message || error);
    return "";
  }
} 