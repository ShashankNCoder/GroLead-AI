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
  if (score >= 80) return "High Priority";
  if (score >= 60) return "Medium Priority";
  if (score >= 40) return "Low Priority";
  return "Very Low Priority";
}

/**
 * Get lead type color for UI display
 */
export function getLeadTypeColor(type: string): string {
  switch (type) {
    case "High Priority":
      return "bg-red-100 text-red-700";
    case "Medium Priority":
      return "bg-orange-100 text-orange-700";
    case "Low Priority":
      return "bg-blue-100 text-blue-700";
    case "Very Low Priority":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

/**
 * Get score bar gradient color
 */
export function getScoreBarColor(score: number, type?: string): string {
  if (type === "High Priority" || score >= 80) return "from-red-500 to-red-600";
  if (type === "Medium Priority" || score >= 60) return "from-orange-400 to-orange-500";
  if (type === "Low Priority" || score >= 40) return "from-blue-400 to-blue-500";
  return "from-slate-400 to-slate-500";
} 