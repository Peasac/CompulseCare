/**
 * Gemini AI Client for CompulseCare
 * Uses direct REST API calls to Google's Gemini API
 * Optimized with retry logic, rate limiting, and caching
 */

import { rateLimitedCall, withRetry } from './gemini-queue';
import { getCached, setCache } from './gemini-cache';
import type { InsightData } from './behavioral-insights';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Model fallback chain: Best quality first → alternatives → hardcoded fallback
const MODEL_CHAIN = [
  "gemini-2.5-flash",      // Best quality (5 RPM)
  "gemini-2.5-flash-lite", // Good quality, higher quota (10 RPM)
  "gemini-3-flash",        // Backup (5 RPM)
];

const BASE_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

// Hardcoded fallback responses when all models are unavailable
const FALLBACK_RESPONSES = {
  panic: "You handled that moment with care. It's okay to take things slowly right now.",
  reflection: "Thank you for sharing. That took courage.",
  weeklyPatterns: "Your compulsions decreased on days when you used the pause button more frequently. The breathing exercises seem to create a buffer between the urge and the action.",
  weeklyHelped: "Your journal entries show you're recognizing triggers earlier in the process. This awareness gives you more time to respond intentionally.",
  weeklySuggestion: "Try using the pause button at the first sign of a trigger, before the compulsion feels urgent.",
  dashboardSnapshot: "Fewer compulsions on days with more pauses.",
  documentAnalysis: "Your documents have been uploaded and stored securely. Try generating insights again later.",
  documentSummary: "Document text extracted and stored for reference.",
  checkInReflection: "Check-in data recorded for longitudinal tracking.",
  insightExplanation: (category: string, confidence: number) => 
    `Pattern detected in ${category} with ${Math.round(confidence * 100)}% confidence.`,
  dailyTargets: [
    { title: "Track 3 compulsions today", description: "Log at least 3 compulsions to build awareness", goal: 3 },
    { title: "Practice breathing exercise", description: "Do 5-minute breathing when urges arise", goal: 1 },
    { title: "Delay one compulsion", description: "Wait 10 minutes before performing one compulsion", goal: 1 },
  ],
  weeklyTargets: [
    { title: "Weekly compulsion tracking", description: "Log at least 15 compulsions this week", goal: 15 },
    { title: "Weekly mindfulness practice", description: "Complete 5 breathing sessions this week", goal: 5 },
    { title: "Weekly exposure goal", description: "Face 3 triggering situations without ritualizing", goal: 3 },
  ],
};

/**
 * Make a direct REST API call to Gemini with full model chain fallback
 */
async function callGemini(prompt: string, modelIndex: number = 0): Promise<string> {
  // If we've exhausted all models, throw to trigger hardcoded fallback
  if (modelIndex >= MODEL_CHAIN.length) {
    throw new Error("All Gemini models exhausted");
  }

  const model = MODEL_CHAIN[modelIndex];
  const endpoint = `${BASE_ENDPOINT}/${model}:generateContent`;
  
  return withRetry(async () => {
    try {
      const response = await fetch(`${endpoint}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (response.status === 429) {
        console.warn(`⚠️ Rate limit hit for ${model}`);
        // Try next model in chain
        if (modelIndex < MODEL_CHAIN.length - 1) {
          console.log(`🔄 Attempting fallback to ${MODEL_CHAIN[modelIndex + 1]}`);
          return callGemini(prompt, modelIndex + 1);
        }
        throw new Error(`All Gemini models rate limited`);
      }

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      if (modelIndex > 0) {
        console.log(`✓ Succeeded with fallback model: ${model}`);
      }
      
      return text;
    } catch (error) {
      // If this isn't the last model, try the next one
      if (modelIndex < MODEL_CHAIN.length - 1 && (error as Error).message.includes('429')) {
        console.log(`🔄 Attempting fallback to ${MODEL_CHAIN[modelIndex + 1]}`);
        return callGemini(prompt, modelIndex + 1);
      }
      throw error;
    }
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
      message: cleanedText || FALLBACK_RESPONSES.panic,
    };

    // Cache result
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error("⚠️ Gemini API error (using hardcoded fallback):", error);
    return {
      message: FALLBACK_RESPONSES.panic,
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

    return cleanedText || FALLBACK_RESPONSES.reflection;
  } catch (error) {
    console.error("⚠️ Gemini API error (using hardcoded fallback):", error);
    return FALLBACK_RESPONSES.reflection;
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
  checkIns?: Array<{ mood: string; thought: string; date: Date }>;
  documents?: Array<{ fileName: string; summary?: string; ocrText?: string }>;
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

    // Build context with check-ins and documents
    let checkInContext = "";
    if (summaryData.checkIns && summaryData.checkIns.length > 0) {
      const checkInSummary = summaryData.checkIns
        .slice(0, 3)
        .map(c => `${c.mood}: "${c.thought}"`)
        .join('; ');
      checkInContext = `\n- Check-ins: ${checkInSummary}`;
    }

    let documentContext = "";
    if (summaryData.documents && summaryData.documents.length > 0) {
      const docSummaries = summaryData.documents
        .slice(0, 2)
        .map(d => d.summary || d.fileName)
        .join('; ');
      documentContext = `\n- Therapy docs: ${docSummaries}`;
    }

    const prompt = `Weekly insights for compulsion/anxiety management. DETAILED analysis for summary page.

Stats:
- Compulsions: ${summaryData.totalCompulsions} (${summaryData.compulsionChange > 0 ? '+' : ''}${summaryData.compulsionChange}%)
- Avg Time: ${summaryData.avgTimeSpent}m
- Anxiety: ${summaryData.avgAnxiety}/10
- Targets: ${summaryData.targetCompletion}%
- Entries: ${summaryData.journalEntries}
- Pauses: ${summaryData.panicEpisodes}
- Top Trigger: ${summaryData.mostCommonTrigger}${checkInContext}${documentContext}

Generate 3 parts:
1. "patterns" - WHY trends happened (2-3 sentences, correlations). ${documentContext ? 'Compare with therapy documents if relevant.' : ''}
2. "whatHelped" - What worked and HOW (2-3 sentences). ${checkInContext ? 'Reference check-in thoughts if applicable.' : ''}
3. "suggestion" - One specific actionable suggestion (1-2 sentences). ${documentContext ? 'Align with therapy goals from documents.' : ''}

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
    console.error("⚠️ Gemini API error (using hardcoded fallback):", error);
    return {
      patterns: FALLBACK_RESPONSES.weeklyPatterns,
      whatHelped: FALLBACK_RESPONSES.weeklyHelped,
      suggestion: FALLBACK_RESPONSES.weeklySuggestion,
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
    console.error("⚠️ Gemini API error (using hardcoded fallback):", error);
    return FALLBACK_RESPONSES.dashboardSnapshot;
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
    console.error("⚠️ Gemini API error (using hardcoded fallback):", error);
    return [
      "You're making progress one day at a time.",
      "Tracking your patterns is a powerful tool for change.",
      "Keep going—you're building resilience.",
    ];
  }
}

/**
 * Transform structured behavioral insights into human-readable text
 * @param insight - Structured insight from behavioral analysis
 * @returns Concise, human-readable explanation
 */
export async function explainBehavioralInsight(insight: InsightData): Promise<string> {
  try {
    // Check cache
    const cacheKey = `insight:${insight.pattern}:${JSON.stringify(insight.statistics)}`;
    const cached = getCached<string>(cacheKey);
    if (cached) return cached;

    const prompt = `Transform this detected behavioral pattern into one concise sentence (max 20 words).

Pattern: ${insight.pattern}
Category: ${insight.category}
Statistics: ${JSON.stringify(insight.statistics)}
Confidence: ${Math.round(insight.confidence * 100)}%

Rules:
- ONE sentence only (max 20 words)
- Factual, grounded in the statistics
- Supportive, non-judgmental tone
- Use "seems", "appears", "tends to" (tentative language)
- NO advice or suggestions
- Focus on observation only

Example outputs:
"Your compulsions peak around 3 PM, with 45% occurring in afternoon hours."
"Checking compulsions appear 60% more often on Mondays."
"Higher anxiety seems linked to 40% longer compulsion time."

Provide ONLY the sentence.`;

    const text = await rateLimitedCall(() => callGemini(prompt));
    const cleaned = text.trim().replace(/^["']|["']$/g, '');
    
    // Enforce max 20 words
    const words = cleaned.split(/\s+/);
    const result = words.length > 20 
      ? words.slice(0, 20).join(' ') + '.'
      : cleaned;

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error("⚠️ Gemini API error (using hardcoded fallback):", error);
    return FALLBACK_RESPONSES.insightExplanation(insight.category, insight.confidence);
  }
}

/**
 * Generate dashboard snapshot from structured behavioral insights
 * @param topInsight - Highest confidence insight
 * @returns Short observation
 */
export async function generateDashboardSnapshotFromInsight(topInsight: InsightData | null): Promise<string> {
  if (!topInsight) {
    return "Continue tracking to reveal patterns.";
  }

  try {
    return await explainBehavioralInsight(topInsight);
  } catch (error) {
    console.error("Error generating dashboard snapshot:", error);
    return "Continue tracking to reveal patterns.";
  }
}

/**
 * Generate neutral reflection on check-in trends over time
 * @param checkIns - Array of check-in responses
 * @returns Neutral, trend-based reflection (no clinical assessment)
 */
export async function generateCheckInReflection(checkIns: any[]): Promise<string> {
  if (checkIns.length < 2) {
    return "Complete a few more check-ins to see trends over time.";
  }

  try {
    // Calculate trend data
    const recent = checkIns.slice(0, Math.min(5, checkIns.length));
    const older = checkIns.slice(Math.min(5, checkIns.length));
    
    const recentAvg = recent.reduce((sum, c) => sum + c.totalScore, 0) / recent.length;
    const olderAvg = older.length > 0 
      ? older.reduce((sum, c) => sum + c.totalScore, 0) / older.length
      : recentAvg;

    const trend = recentAvg > olderAvg ? 'increased' : recentAvg < olderAvg ? 'decreased' : 'stable';
    const change = Math.abs(recentAvg - olderAvg);

    const prompt = `Generate one neutral, factual observation (max 25 words) about check-in response trends.

Recent average score: ${Math.round(recentAvg * 10) / 10}
Previous average score: ${Math.round(olderAvg * 10) / 10}
Trend: ${trend}
Change magnitude: ${Math.round(change * 10) / 10}

Rules:
- ONE sentence only (max 25 words)
- Purely observational, no interpretation
- Neutral tone, no clinical terms
- No advice, recommendations, or assessments
- Focus on what changed, not why

Examples:
"Your check-in scores have decreased by an average of 2.3 points over recent responses."
"Check-in responses remain relatively stable compared to previous weeks."

Provide ONLY the sentence.`;

    const text = await rateLimitedCall(() => callGemini(prompt));
    const cleaned = text.trim().replace(/^["']|["']$/g, '');
    
    const words = cleaned.split(/\s+/);
    return words.length > 25 
      ? words.slice(0, 25).join(' ') + '.'
      : cleaned;

  } catch (error) {
    console.error("⚠️ Gemini API error (using hardcoded fallback):", error);
    return FALLBACK_RESPONSES.checkInReflection;
  }
}

/**
 * Summarize OCR-extracted document text for readability
 * @param ocrText - Raw OCR extracted text
 * @returns Neutral, readable summary
 */
export async function summarizeDocument(ocrText: string): Promise<string> {
  try {
    // Check cache
    const cacheKey = `document:summary:${ocrText.substring(0, 100)}`;
    const cached = getCached<string>(cacheKey);
    if (cached) return cached;

    const prompt = `Summarize this document text in 2-3 neutral, factual sentences. Be concise and readable.

Document text:
${ocrText.substring(0, 2000)}${ocrText.length > 2000 ? '...' : ''}

Rules:
- 2-3 sentences maximum
- Neutral, factual tone
- No clinical interpretation or assessment
- Focus on what the document contains
- NO advice or recommendations

Provide ONLY the summary.`;

    const text = await rateLimitedCall(() => callGemini(prompt));
    const cleaned = text.trim().replace(/^["']|["']$/g, '');
    
    setCache(cacheKey, cleaned);
    return cleaned;

  } catch (error) {
    console.error("⚠️ Gemini API error (using hardcoded fallback):", error);
    return FALLBACK_RESPONSES.documentSummary;
  }
}

/**
 * Analyze uploaded documents and extract OCD-related insights
 */
export async function analyzeDocuments(documents: Array<{ ocrText: string; fileName: string; _id?: string }>): Promise<string> {
  try {
    if (documents.length === 0) {
      return "No documents uploaded yet. Upload therapy notes, assessments, or related documents to get AI insights.";
    }

    // Create cache key from document IDs and content hash
    const docKey = documents
      .map(d => `${d._id || d.fileName}:${d.ocrText?.substring(0, 50)}`)
      .join('|');
    const cacheKey = `documents:analysis:${docKey.substring(0, 200)}`; // Limit key length
    const cached = getCached<string>(cacheKey);
    if (cached) {
      console.log('[Gemini] Returning cached document analysis');
      return cached;
    }

    // Combine document texts (limit to prevent token overflow)
    const combinedText = documents
      .map(d => `Document: ${d.fileName}\n${d.ocrText.substring(0, 1500)}`)
      .join('\n\n---\n\n')
      .substring(0, 8000);

    const prompt = `Analyze these uploaded documents for OCD-related patterns and information. Extract key insights.

${combinedText}

Provide a brief analysis (4-5 sentences) covering:
1. Main OCD themes or symptoms mentioned
2. Therapy approaches or treatments referenced
3. Progress indicators or assessment results
4. Relevant patterns or triggers identified

Rules:
- Be factual and neutral
- Focus only on what's in the documents
- No diagnosis or medical advice
- Highlight actionable insights
- Use supportive, non-clinical language

Provide ONLY the analysis.`;

    const text = await rateLimitedCall(() => callGemini(prompt));
    const cleaned = text.trim();
    
    // Cache for 24 hours
    setCache(cacheKey, cleaned);
    return cleaned;

  } catch (error) {
    console.error("⚠️ Gemini API error (using hardcoded fallback):", error);
    return FALLBACK_RESPONSES.documentAnalysis;
  }
}

/**
 * Generate personalized target suggestions using Gemini AI
 */
export async function generateTargetSuggestions(data: {
  type: "daily" | "weekly";
  count: number;
  recentEntries?: any[];
  existingTargets?: any[];
  completionRate?: number;
}): Promise<{
  title: string;
  description: string;
  goal: number;
}[]> {
  try {
    const { type, count, recentEntries = [], existingTargets = [], completionRate = 0 } = data;
    
    // Build context from user data
    const context = recentEntries.length > 0
      ? `Recent compulsions logged: ${recentEntries.length}
Most common triggers: ${recentEntries.slice(0, 5).map((e: any) => e.triggerType || e.trigger).join(', ')}
Completion rate: ${completionRate.toFixed(0)}%`
      : "New user - first time setting targets";

    const prompt = `Generate ${count} ${type} OCD recovery targets for someone managing compulsions. 

User Context:
${context}

Requirements:
- Each target should be specific, measurable, and achievable
- Focus on ERP (Exposure and Response Prevention) principles
- Include mindfulness and tracking goals
- Goals should have numeric values (1-10 range)
- Return ONLY a JSON array, no additional text

Format:
[
  {
    "title": "Short action-oriented title",
    "description": "Clear description of what to do and why",
    "goal": <number between 1-10>
  }
]

Examples for daily:
- Track compulsions throughout the day (goal: 3)
- Practice breathing exercises when triggered (goal: 2)
- Delay one compulsion by 10 minutes (goal: 1)

Examples for weekly:
- Log 15 compulsions to identify patterns (goal: 15)
- Complete 5 breathing sessions (goal: 5)
- Face 3 triggering situations without ritualizing (goal: 3)`;

    const text = await rateLimitedCall(() => callGemini(prompt));
    
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, count);
        }
      } catch (e) {
        console.warn("Failed to parse Gemini suggestions:", e);
      }
    }
    
    // Fallback suggestions
    return type === "daily" 
      ? [
          { title: "Track 3 compulsions today", description: "Log at least 3 compulsions to build awareness", goal: 3 },
          { title: "Practice breathing exercise", description: "Do 5-minute breathing when urges arise", goal: 1 },
          { title: "Delay one compulsion", description: "Wait 10 minutes before performing one compulsion", goal: 1 },
        ].slice(0, count)
      : [
          { title: "Weekly compulsion tracking", description: "Log at least 15 compulsions this week", goal: 15 },
          { title: "Weekly mindfulness practice", description: "Complete 5 breathing sessions this week", goal: 5 },
          { title: "Weekly exposure goal", description: "Face 3 triggering situations without ritualizing", goal: 3 },
        ].slice(0, count);
        
  } catch (error) {
    console.error("⚠️ Gemini API error (using hardcoded fallback):", error);
    return data.type === "daily"
      ? FALLBACK_RESPONSES.dailyTargets.slice(0, data.count)
      : FALLBACK_RESPONSES.weeklyTargets.slice(0, data.count);
  }
}
