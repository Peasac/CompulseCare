import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Gemini AI Client for CompulseCare
 * Uses Google's Gemini API for supportive messages and insights
 */

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Get supportive message during panic episodes
 * @param context - Optional context about the user's state
 * @returns Calming, supportive message
 */
export async function getPanicSupport(context?: string): Promise<{
  message: string;
  suggestions: string[];
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `You are a compassionate mental health support assistant for someone experiencing a panic episode related to OCD compulsions.

${context ? `Context: ${context}` : ""}

Provide:
1. A short, calming, validating message (2-3 sentences max)
2. Three specific, actionable grounding techniques

Be warm, non-judgmental, and focus on immediate relief. Avoid medical advice.

Format your response as JSON:
{
  "message": "your calming message here",
  "suggestions": ["technique 1", "technique 2", "technique 3"]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        message: parsed.message || text,
        suggestions: parsed.suggestions || [
          "Take 3 deep breaths",
          "Ground yourself with 5-4-3-2-1",
          "You're safe right now",
        ],
      };
    }

    // Fallback if JSON parsing fails
    return {
      message: text.split("\n")[0] || "You're doing great. This feeling will pass.",
      suggestions: [
        "Take 3 deep breaths",
        "Ground yourself with 5-4-3-2-1",
        "You're safe right now",
      ],
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    // Return fallback supportive message
    return {
      message: "You're doing great. Take a moment to breathe. This feeling will pass.",
      suggestions: [
        "Breathe: In for 4, hold for 4, out for 6",
        "Name 5 things you can see around you",
        "Remember: You've gotten through this before",
      ],
    };
  }
}

/**
 * Generate weekly insights based on user data
 * @param summaryData - User's weekly stats
 * @returns AI-generated insights
 */
export async function generateWeeklyInsights(summaryData: {
  panicEpisodes: number;
  journalEntries: number;
  targetCompletion: number;
  avgAnxiety: number;
  topTriggers: string[];
}): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `You are a supportive mental health insights generator for someone managing OCD.

Weekly Data:
- Panic Episodes: ${summaryData.panicEpisodes}
- Journal Entries: ${summaryData.journalEntries}
- Target Completion: ${summaryData.targetCompletion}%
- Average Anxiety: ${summaryData.avgAnxiety}/10
- Top Triggers: ${summaryData.topTriggers.join(", ")}

Generate 3 brief, encouraging insights (1-2 sentences each) that:
1. Highlight progress or positive patterns
2. Offer gentle observations about triggers/patterns
3. Provide actionable encouragement

Be specific to the data, warm, and hopeful. Format as a JSON array of strings.

Example format:
["insight 1", "insight 2", "insight 3"]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON array
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 3);
      }
    }

    // Fallback insights
    return [
      `You logged ${summaryData.journalEntries} entries this week—great self-awareness!`,
      `Your anxiety spikes often relate to ${summaryData.topTriggers[0] || "specific triggers"}. Consider planning ahead.`,
      `Target completion at ${summaryData.targetCompletion}% shows real progress!`,
    ];
  } catch (error) {
    console.error("Gemini API error:", error);
    // Return fallback insights
    return [
      "You're making progress one day at a time.",
      "Tracking your patterns is a powerful tool for change.",
      "Keep going—you're building resilience.",
    ];
  }
}
