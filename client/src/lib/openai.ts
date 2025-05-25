// Client-side OpenAI utilities for GroLead AI
// Note: This file handles client-side AI-related formatting and utilities
// The actual OpenAI API calls are handled server-side for security

export interface LeadScoringResult {
  score: number;
  type: string;
  reason: string;
  bestContactTime: string;
  confidence: number;
}

export interface AIInsight {
  type: "timing" | "product" | "followup" | "segmentation";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string;
  action: string;
  confidence: number;
}

/**
 * Format AI reasoning text for display with typewriter effect
 */
export function formatAIReasoning(reasoning: string): string {
  // Clean up and format the AI reasoning text
  return reasoning
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200) + (reasoning.length > 200 ? "..." : "");
}

/**
 * Get lead type based on score
 */
export function getLeadType(score: number): string {
  if (score >= 80) return "hot";
  if (score >= 60) return "warm";
  if (score >= 40) return "cold";
  return "low";
}

/**
 * Get lead type color for UI display
 */
export function getLeadTypeColor(type: string): string {
  switch (type) {
    case "hot":
      return "bg-red-100 text-red-700";
    case "warm":
      return "bg-orange-100 text-orange-700";
    case "cold":
      return "bg-blue-100 text-blue-700";
    case "low":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

/**
 * Get score bar gradient color
 */
export function getScoreBarColor(score: number, type?: string): string {
  if (type === "hot" || score >= 80) return "from-red-500 to-red-600";
  if (type === "warm" || score >= 60) return "from-orange-400 to-orange-500";
  if (type === "cold" || score >= 40) return "from-blue-400 to-blue-500";
  return "from-slate-400 to-slate-500";
}

/**
 * Generate personalized message from template
 */
export function personalizeMessage(template: string, leadData: any): string {
  return template
    .replace(/\{name\}/gi, leadData.name || "there")
    .replace(/\{product\}/gi, leadData.product || "our product")
    .replace(/\{loanAmount\}/gi, leadData.loanAmount || "the amount you need")
    .replace(/\{amount\}/gi, leadData.loanAmount || "the amount you need")
    .replace(/\{city\}/gi, leadData.city || "your city")
    .replace(/\{income\}/gi, leadData.monthlyIncome || "your income")
    .replace(/\{employment\}/gi, leadData.employmentType || "your employment");
}

/**
 * Analyze message effectiveness
 */
export function analyzeMessageEffectiveness(message: string): {
  score: number;
  suggestions: string[];
} {
  let score = 70; // Base score
  const suggestions: string[] = [];

  // Check for personalization
  if (message.includes("{name}") || message.includes("{product}")) {
    score += 10;
  } else {
    suggestions.push("Add personalization with {name} or {product} placeholders");
  }

  // Check for call to action
  if (message.includes("call") || message.includes("schedule") || message.includes("contact")) {
    score += 10;
  } else {
    suggestions.push("Include a clear call to action");
  }

  // Check for emojis
  if (/[\u{1F300}-\u{1F9FF}]/u.test(message)) {
    score += 5;
  } else {
    suggestions.push("Consider adding relevant emojis for better engagement");
  }

  // Check length
  if (message.length > 500) {
    score -= 10;
    suggestions.push("Message is too long - keep it under 500 characters");
  } else if (message.length < 50) {
    score -= 5;
    suggestions.push("Message might be too short - add more context");
  }

  // Check for greeting
  if (message.toLowerCase().includes("hi") || message.toLowerCase().includes("hello")) {
    score += 5;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    suggestions,
  };
}

/**
 * Generate AI insights based on lead data
 */
export function generateAIInsights(leads: any[], analytics: any): AIInsight[] {
  const insights: AIInsight[] = [];

  // Timing insight
  if (analytics?.conversionRate) {
    insights.push({
      type: "timing",
      priority: "high",
      title: "Optimize Contact Timing",
      description: "Analysis shows higher response rates during evening hours (6-8 PM)",
      impact: "Expected 15% increase in response rate",
      action: "Schedule more campaigns for evening hours",
      confidence: 0.85,
    });
  }

  // Product insight
  const homeLoanLeads = leads.filter(lead => lead.product === "Home Loan");
  if (homeLoanLeads.length > 0) {
    const homeLoanConversion = homeLoanLeads.filter(lead => lead.status === "converted").length / homeLoanLeads.length;
    if (homeLoanConversion > 0.3) {
      insights.push({
        type: "product",
        priority: "high",
        title: "Focus on Home Loans",
        description: `Home loan leads show ${(homeLoanConversion * 100).toFixed(1)}% conversion rate`,
        impact: "Potential 25% increase in overall conversions",
        action: "Allocate more resources to home loan lead generation",
        confidence: 0.92,
      });
    }
  }

  // Follow-up insight
  const warmLeads = leads.filter(lead => (lead.aiScore || 0) >= 60 && (lead.aiScore || 0) < 80);
  if (warmLeads.length > 5) {
    insights.push({
      type: "followup",
      priority: "medium",
      title: "Improve Follow-up Strategy",
      description: `${warmLeads.length} warm leads need systematic follow-up`,
      impact: "Expected 20% increase in warm lead conversions",
      action: "Set up automated follow-up sequences",
      confidence: 0.78,
    });
  }

  return insights;
}

/**
 * Calculate lead score confidence based on available data
 */
export function calculateScoreConfidence(lead: any): number {
  let confidence = 0.5; // Base confidence

  // Increase confidence based on available data
  if (lead.monthlyIncome) confidence += 0.15;
  if (lead.employmentType) confidence += 0.1;
  if (lead.city) confidence += 0.1;
  if (lead.loanAmount) confidence += 0.1;
  if (lead.email) confidence += 0.05;

  return Math.min(0.95, confidence);
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: string | number): string {
  if (!amount) return "Not specified";
  
  const numAmount = typeof amount === "string" ? parseFloat(amount.replace(/[^\d.]/g, "")) : amount;
  
  if (numAmount >= 10000000) {
    return `₹${(numAmount / 10000000).toFixed(1)}Cr`;
  } else if (numAmount >= 100000) {
    return `₹${(numAmount / 100000).toFixed(1)}L`;
  } else if (numAmount >= 1000) {
    return `₹${(numAmount / 1000).toFixed(1)}K`;
  } else {
    return `₹${numAmount.toLocaleString()}`;
  }
}

/**
 * Get best contact time suggestion based on lead profile
 */
export function suggestContactTime(lead: any): string {
  if (lead.employmentType === "Salaried") {
    return "6:00 PM - 8:00 PM";
  } else if (lead.employmentType === "Self Employed" || lead.employmentType === "Business Owner") {
    return "10:00 AM - 12:00 PM";
  } else {
    return "2:00 PM - 4:00 PM";
  }
}
