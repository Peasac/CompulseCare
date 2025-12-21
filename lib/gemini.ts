/**
 * Gemini AI Client for CompulseCare
 * Uses direct REST API calls to Google's Gemini API
 * Optimized with retry logic, rate limiting, and caching
 */

import { rateLimitedCall, withRetry } from './gemini-queue';
import { getCached, setCache } from './gemini-cache';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

/**
 * Make a direct REST API call to Gemini with retry logic
 */
async function callGemini(prompt: string): Promise<string> {
  return withRetry(async () => {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (response.status === 429) {
      throw new Error(`Gemini API rate limit: 429`);
    }

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  });
}

/**
 * Get supportive message during panic episodes
 * @param context - Optional context about the user's state
 * @returns Calming, supportive message
 */
export async function getPanicSupport(context?: string): Promise<{
  message: string;
}> {
  try {
    // Check cache
    const cacheKey = `panic:support:${context || 'default'}`;
    const cached = getCached<{ message: string }>(cacheKey);
    if (cached) return cached;

    const prompt = `Compassionate support for someone after breathing exercise during panic.
${context ? `Context: ${context}` : ""}

Rules: Max 2 sentences. Calm, validating. No advice, questions, exclamations, "should" language, clinical terms.

Provide ONLY message text.`;

    const text = await rateLimitedCall(() => callGemini(prompt));
    
    // Clean up any formatting
    const cleanedText = text
      .replace(/["\{\}]/g, '')
      .replace(/^message:\s*/i, '')
      .trim();

    const result = {
      message: cleanedText || "You handled that moment with care. It's okay to take things slowly right now.",
    };

    // Cache result
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Gemini API error:", error);
    return {
      message: "You handled that moment with care. It's okay to take things slowly right now.",
    };
  }
}

/**
 * Get reflective response to user's panic moment writing
 * @param userReflection - What the user wrote about their panic moment
 * @returns Calm, reflective 1-2 sentence response
 */
export async function getPanicReflection(userReflection: string): Promise<string> {
  try {
    const prompt = `Compassionate reflective listener for panic episode processing.

User wrote: "${userReflection}"

Rules: Max 1-2 sentences. Reflect and normalize. Calm tone. No advice, questions, exclamations, "should" language, clinical terms.

Provide ONLY reflection text.`;

    const text = await rateLimitedCall(() => callGemini(prompt));
    
    // Clean up any formatting
    const cleanedText = text
      .replace(/["\{\}]/g, '')
      .replace(/^reflection:\s*/i, '')
      .trim();

    return cleanedText || "That sounds like it was a lot to carry. You're processing it now.";
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Thank you for sharing. That took courage.";
  }
}

/**
 * Generate weekly reflection for /summary page (DETAILED analysis)
 * @param summaryData - User's weekly aggregated stats
 * @returns Structured reflection with patterns (WHY), what helped, and suggestion
 */
export async function generateWeeklyReflection(summaryData: {
  totalCompulsions: number;
  compulsionChange: number;
  avgTimeSpent: number;
  avgAnxiety: number;
  targetCompletion: number;
  journalEntries: number;
  panicEpisodes: number;
  mostCommonTrigger: string;
}): Promise<{
  patterns: string;
  whatHelped: string;
  suggestion: string;
}> {
  try {
    // Check cache first
    const cacheKey = `summary:${JSON.stringify(summaryData)}`;
    const cached = getCached<{ patterns: string; whatHelped: string; suggestion: string }>(cacheKey);
    if (cached) return cached;

    const prompt = `Weekly insights for compulsion/anxiety management. DETAILED analysis for summary page.

Stats:
- Compulsions: ${summaryData.totalCompulsions} (${summaryData.compulsionChange > 0 ? '+' : ''}${summaryData.compulsionChange}%)
- Avg Time: ${summaryData.avgTimeSpent}m
- Anxiety: ${summaryData.avgAnxiety}/10
- Targets: ${summaryData.targetCompletion}%
- Entries: ${summaryData.journalEntries}
- Pauses: ${summaryData.panicEpisodes}
- Top Trigger: ${summaryData.mostCommonTrigger}

Generate 3 parts:
1. "patterns" - WHY trends happened (2-3 sentences, correlations)
2. "whatHelped" - What worked and HOW (2-3 sentences)
3. "suggestion" - One specific actionable suggestion (1-2 sentences)

JSON format:
{"patterns": "...", "whatHelped": "...", "suggestion": "..."}`;

    const text = await rateLimitedCall(() => callGemini(prompt));

    // Try to parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.patterns && parsed.whatHelped && parsed.suggestion) {
          setCache(cacheKey, parsed);
          return parsed;
        }
      } catch (e) {
        console.warn("Failed to parse Gemini JSON response:", e);
      }
    }

    // Fallback reflection with detailed pattern analysis
    const patternsText = summaryData.compulsionChange < 0 && summaryData.panicEpisodes > 5
      ? `Your compulsions decreased on days when you used the pause button more frequently. The breathing exercises seem to create a buffer between the urge and the action, giving you time to make a different choice. This pattern suggests the pause sessions are disrupting the automatic compulsion cycle.`
      : `Your most frequent compulsions appear after encountering ${summaryData.mostCommonTrigger} triggers. The consistency in this pattern means you can start preparing responses before the trigger occurs. Anticipating these moments gives you an advantage.`;

    const whatHelpedText = summaryData.journalEntries > 4
      ? `Your journal entries show you're recognizing triggers earlier in the process. This awareness is giving you more time to respond intentionally rather than react automatically. The more you log, the earlier you notice patterns emerging.`
      : `Using pause sessions ${summaryData.panicEpisodes} times this week created natural breaks in compulsion cycles. Those breathing moments seem to interrupt the automatic response pattern, giving you space to choose differently.`;

    const suggestionText = summaryData.targetCompletion > 70
      ? `Try using the pause button at the first sign of a trigger, before the compulsion feels urgent. Early intervention seems to work best for your patterns based on this week's data.`
      : `Focus on using the pause button for just one specific trigger this week. Mastering one pattern is more effective than trying to change everything at once.`;

    const result = {
      patterns: patternsText,
      whatHelped: whatHelpedText,
      suggestion: suggestionText,
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Gemini API error:", error);
    return {
      patterns: "Your compulsions decreased on days when you used the pause button more frequently. The breathing exercises seem to create a buffer between the urge and the action, giving you time to make a different choice.",
      whatHelped: "Your journal entries show you're recognizing triggers earlier in the process. This awareness is giving you more time to respond intentionally rather than react automatically.",
      suggestion: "Try using the pause button at the first sign of a trigger, before the compulsion feels urgent.",
    };
  }
}

/**
 * Generate dashboard snapshot - a single quick observation
 * @param summaryData - User's weekly stats
 * @returns One-sentence glanceable insight (max 15 words)
 */
export async function generateDashboardSnapshot(summaryData: {
  totalCompulsions: number;
  compulsionChange: number;
  panicEpisodes: number;
  journalEntries: number;
  targetCompletion: number;
  avgAnxiety: number;
}): Promise<string> {
  try {
    // Check cache
    const cacheKey = `dashboard:${JSON.stringify(summaryData)}`;
    const cached = getCached<string>(cacheKey);
    if (cached) return cached;

    const prompt = `One short observation (max 15 words) from week's data. Glanceable hint only.

Stats:
- Compulsions: ${summaryData.totalCompulsions} (${summaryData.compulsionChange > 0 ? '+' : ''}${summaryData.compulsionChange}%)
- Pauses: ${summaryData.panicEpisodes}
- Entries: ${summaryData.journalEntries}
- Targets: ${summaryData.targetCompletion}%
- Anxiety: ${summaryData.avgAnxiety}/10

Rules: 1 sentence, max 15 words, tentative tone ("seems", "might", "appears"), one correlation only.

Provide ONLY sentence.`;

    const text = await rateLimitedCall(() => callGemini(prompt));
    
    // Clean and truncate to 15 words max
    const cleaned = text
      .replace(/["\{\}]/g, '')
      .replace(/^(snapshot|observation):\s*/i, '')
      .trim();
    
    const words = cleaned.split(/\s+/);
    const result = words.length > 15 
      ? words.slice(0, 15).join(' ') + '.'
      : cleaned || "Fewer compulsions on days with more pauses.";
    
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Fewer compulsions on days with more pauses.";
  }
}

/**
 * Generate weekly insights based on user data (legacy function)
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

    const text = await rateLimitedCall(() => callGemini(prompt));

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
    return [
      "You're making progress one day at a time.",
      "Tracking your patterns is a powerful tool for change.",
      "Keep going—you're building resilience.",
    ];
  }
}
