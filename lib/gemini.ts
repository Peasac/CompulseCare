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
    const prompt = `You are a supportive, pattern-analysis assistant providing DETAILED weekly insights for someone managing compulsions and anxiety. This is for the main summary page where detailed analysis is appropriate.

Weekly Aggregated Stats (DO NOT recalculate or repeat these numbers):
- Total Compulsions: ${summaryData.totalCompulsions} (${summaryData.compulsionChange > 0 ? '+' : ''}${summaryData.compulsionChange}% vs last week)
- Avg Time Spent: ${summaryData.avgTimeSpent} minutes
- Avg Anxiety: ${summaryData.avgAnxiety}/10
- Target Completion: ${summaryData.targetCompletion}%
- Journal Entries: ${summaryData.journalEntries}
- Pause Sessions: ${summaryData.panicEpisodes}
- Most Common Trigger: ${summaryData.mostCommonTrigger}

Generate a DETAILED Weekly Reflection with EXACTLY these 3 parts:

1. "patterns" - Provide DETAILED explanation of WHY trends happened. Find correlations and explain the mechanism. This should be substantive (2-3 sentences). Example: "Your compulsions decreased on days when you used the pause button more frequently. The breathing exercises seem to create a buffer between the urge and the action, giving you time to make a different choice."

2. "whatHelped" - Provide DETAILED analysis of what strategies made a difference and explain HOW they work. This should be thorough (2-3 sentences). Example: "Your journal entries show you're recognizing triggers earlier in the process. This awareness is giving you more time to respond intentionally rather than react automatically. The more you log, the earlier you notice."

3. "suggestion" - Provide ONE specific, gentle, actionable suggestion with clear reasoning. Should be concrete and grounded in patterns (1-2 sentences). Example: "Try using the pause button at the first sign of a trigger, before the compulsion feels urgent. Early intervention seems to work best for your patterns."

CRITICAL RULES:
- THIS IS DETAILED ANALYSIS (not a glanceable hint)
- Explain WHY and HOW, with depth
- Find correlations between different data points
- Be specific to this person's data
- Use calm, supportive, non-clinical language
- NO generic encouragement
- NO medical advice or crisis language
- Grounded in available data only

Format as JSON:
{
  "patterns": "...",
  "whatHelped": "...",
  "suggestion": "..."
}`;

    const text = await callGemini(prompt);

    // Try to parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.patterns && parsed.whatHelped && parsed.suggestion) {
        return parsed;
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

    return {
      patterns: patternsText,
      whatHelped: whatHelpedText,
      suggestion: suggestionText,
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    return {
      patterns: "Your compulsions decreased on days when you used the pause button more frequently. The breathing exercises seem to create a buffer between the urge and the action, giving you time to make a different choice.",
      whatHelped: "Your journal entries show you're recognizing triggers earlier in the process. This awareness is giving you more time to respond intentionally rather than react automatically.",
      suggestion: "Try using the pause button at the first sign of a trigger, before the compulsion feels urgent. Early intervention seems to work best for your patterns.",
    };
  }
}

/**
 * Generate dashboard AI snapshot - ONE short, tentative hint (glanceable)
 * @param summaryData - User's weekly stats
 * @returns Single tentative sentence (max 15 words)
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
    const prompt = `Generate ONE very short, tentative observation (max 15 words) based on this week's data. This is a GLANCEABLE HINT only, not detailed analysis.

Weekly Stats:
- Compulsions: ${summaryData.totalCompulsions} (${summaryData.compulsionChange > 0 ? '+' : ''}${summaryData.compulsionChange}% vs last week)
- Pause Sessions: ${summaryData.panicEpisodes}
- Journal Entries: ${summaryData.journalEntries}
- Target Completion: ${summaryData.targetCompletion}%
- Avg Anxiety: ${summaryData.avgAnxiety}/10

CRITICAL RULES:
- EXACTLY one sentence
- Maximum 15 words
- Tentative tone (use "seems", "might", "appears")
- Glanceable hint, not explanation
- NO advice, NO lists, NO explanations
- Just note ONE correlation or trend

Good examples:
"Fewer compulsions on days with more pauses."
"Anxiety seems lower when you journal regularly."
"Compulsions dropped as pause sessions increased."

Bad examples (too detailed):
"Your compulsions dropped because you used pauses — keep it up."
"Multiple patterns show improvement in several areas."

Provide ONLY the short sentence (no quotes, no formatting).`;

    const text = await callGemini(prompt);
    
    const cleaned = text.trim().replace(/^["']|["']$/g, '');
    
    // Enforce max 15 words
    const words = cleaned.split(/\s+/);
    if (words.length > 15) {
      return words.slice(0, 15).join(' ') + '.';
    }
    
    return cleaned || "Fewer compulsions on days with more pauses.";
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
