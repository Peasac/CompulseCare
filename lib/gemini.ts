/**
 * Gemini AI Client for CompulseCare
 * Uses direct REST API calls to Google's Gemini API
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";

/**
 * Make a direct REST API call to Gemini
 */
async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
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
    const prompt = `You are a compassionate mental health support assistant for someone who just completed a breathing exercise during a panic episode.

${context ? `Context: ${context}` : ""}

Generate a SHORT reassurance message following these strict rules:
- Maximum 2 sentences
- Calm and validating tone
- NO advice, NO instructions, NO questions
- NO exclamation marks
- NO "you should" language
- NO clinical or disorder labels

Examples of good responses:
"You handled that moment with care. It's okay to take things slowly right now."
"You're doing what you need to do. That took courage."
"This feeling is temporary. You're safe in this moment."

Provide ONLY the message text (no JSON, no formatting).`;

    const text = await callGemini(prompt);
    
    // Clean up any formatting
    const cleanedText = text
      .replace(/["\{\}]/g, '')
      .replace(/^message:\s*/i, '')
      .trim();

    return {
      message: cleanedText || "You handled that moment with care. It's okay to take things slowly right now.",
    };
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
    const prompt = `You are a compassionate, reflective listener for someone who just experienced a panic episode and is processing it.

The user wrote:
"${userReflection}"

Generate a BRIEF reflective response following these strict rules:
- Maximum 1-2 sentences
- Reflect back what they shared, normalize it
- Calm, steady, quiet tone
- NO advice, NO instructions, NO questions
- NO exclamation marks
- NO "you should" language
- NO mental health labels or clinical terms
- DO NOT validate the fear itself, normalize the response to it

Examples of good responses:
"That sounds like it was a lot to carry. You're processing it now."
"It makes sense that felt overwhelming. You're here, working through it."
"Those moments can feel really big. You're taking time to understand it."

Provide ONLY the reflection text (no JSON, no formatting).`;

    const text = await callGemini(prompt);
    
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

    const text = await callGemini(prompt);

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
