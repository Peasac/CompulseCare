/**
 * Behavioral Insight Engine
 * Analyzes historical user data to detect meaningful patterns using deterministic logic
 * Returns structured insights with confidence scores and supporting statistics
 * 
 * Pattern Detection Areas:
 * - Time-based trends (hour of day, day of week)
 * - Trigger frequency and evolution
 * - Anxiety-compulsion correlations
 * - Target completion patterns
 * - Panic session effectiveness
 */

export interface InsightData {
  pattern: string;
  confidence: number; // 0-1
  statistics: {
    [key: string]: number | string;
  };
  timeframe: string;
  category: 'time-based' | 'trigger' | 'anxiety-correlation' | 'target-pattern' | 'panic-effectiveness';
}

export interface BehavioralAnalysis {
  insights: InsightData[];
  dataQuality: {
    entriesAnalyzed: number;
    daysOfData: number;
    completeness: number; // 0-1
  };
}

/**
 * Analyze time-based patterns in compulsions
 */
function analyzeTimePatterns(entries: any[]): InsightData[] {
  if (entries.length < 5) return [];

  const insights: InsightData[] = [];
  const hourCounts: { [hour: number]: number } = {};
  const dayOfWeekCounts: { [day: number]: number } = {};

  entries.forEach(entry => {
    const date = new Date(entry.createdAt);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
  });

  // Find peak hour
  const peakHour = Object.entries(hourCounts).reduce((max, [hour, count]) => 
    count > (hourCounts[max[0]] || 0) ? [hour, count] : max, 
    ['0', 0]
  );

  const peakHourPercent = (Number(peakHour[1]) / entries.length) * 100;
  
  if (peakHourPercent > 25) { // If >25% of compulsions happen in one hour range
    const hourNum = Number(peakHour[0]);
    const timeRange = hourNum < 12 ? 'morning' : hourNum < 17 ? 'afternoon' : 'evening';
    
    insights.push({
      pattern: `peak-hour-${timeRange}`,
      confidence: Math.min(peakHourPercent / 50, 1), // Max confidence at 50%
      statistics: {
        peakHour: hourNum,
        peakHourCount: Number(peakHour[1]),
        percentageInPeak: Math.round(peakHourPercent),
        timeRange,
      },
      timeframe: 'hourly',
      category: 'time-based',
    });
  }

  // Find peak day of week
  const peakDay = Object.entries(dayOfWeekCounts).reduce((max, [day, count]) =>
    count > (dayOfWeekCounts[Number(max[0])] || 0) ? [day, count] : max,
    ['0', 0]
  );

  const peakDayPercent = (Number(peakDay[1]) / entries.length) * 100;
  
  if (peakDayPercent > 20) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    insights.push({
      pattern: 'peak-weekday',
      confidence: Math.min(peakDayPercent / 40, 1),
      statistics: {
        peakDay: dayNames[Number(peakDay[0])],
        peakDayCount: Number(peakDay[1]),
        percentageInPeak: Math.round(peakDayPercent),
      },
      timeframe: 'weekly',
      category: 'time-based',
    });
  }

  return insights;
}

/**
 * Analyze trigger frequency and evolution over time
 */
function analyzeTriggerPatterns(entries: any[]): InsightData[] {
  if (entries.length < 10) return [];

  const insights: InsightData[] = [];
  const triggerCounts: { [trigger: string]: number } = {};
  const triggerByWeek: { [trigger: string]: number[] } = {};

  // Group by week
  const weekGroups: { [week: string]: any[] } = {};
  entries.forEach(entry => {
    const date = new Date(entry.createdAt);
    const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
    
    if (!weekGroups[weekKey]) weekGroups[weekKey] = [];
    weekGroups[weekKey].push(entry);

    (entry.triggers || []).forEach((trigger: string) => {
      triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
    });
  });

  // Find dominant trigger
  const dominantTrigger = Object.entries(triggerCounts).reduce((max, [trigger, count]) =>
    count > (triggerCounts[max[0]] || 0) ? [trigger, count] : max,
    ['', 0]
  );

  if (dominantTrigger[1] > entries.length * 0.3) {
    insights.push({
      pattern: 'dominant-trigger',
      confidence: Math.min((Number(dominantTrigger[1]) / entries.length) / 0.5, 1),
      statistics: {
        trigger: dominantTrigger[0],
        occurrences: Number(dominantTrigger[1]),
        percentage: Math.round((Number(dominantTrigger[1]) / entries.length) * 100),
        totalEntries: entries.length,
      },
      timeframe: 'overall',
      category: 'trigger',
    });
  }

  // Analyze trigger trend (increasing/decreasing)
  if (Object.keys(weekGroups).length >= 3) {
    const weeks = Object.keys(weekGroups).sort();
    const recentWeeks = weeks.slice(-3);
    const olderWeeks = weeks.slice(0, Math.min(3, weeks.length - 3));

    if (olderWeeks.length > 0 && recentWeeks.length > 0) {
      const oldAvg = olderWeeks.reduce((sum, week) => sum + weekGroups[week].length, 0) / olderWeeks.length;
      const recentAvg = recentWeeks.reduce((sum, week) => sum + weekGroups[week].length, 0) / recentWeeks.length;
      
      const changePercent = ((recentAvg - oldAvg) / oldAvg) * 100;
      
      if (Math.abs(changePercent) > 20) {
        insights.push({
          pattern: changePercent > 0 ? 'trigger-frequency-increasing' : 'trigger-frequency-decreasing',
          confidence: Math.min(Math.abs(changePercent) / 50, 1),
          statistics: {
            trend: changePercent > 0 ? 'increasing' : 'decreasing',
            changePercent: Math.round(Math.abs(changePercent)),
            oldAverage: Math.round(oldAvg * 10) / 10,
            recentAverage: Math.round(recentAvg * 10) / 10,
          },
          timeframe: '3-week-trend',
          category: 'trigger',
        });
      }
    }
  }

  return insights;
}

/**
 * Analyze correlation between anxiety levels and compulsion frequency/duration
 */
function analyzeAnxietyCorrelations(entries: any[]): InsightData[] {
  if (entries.length < 15) return [];

  const insights: InsightData[] = [];
  
  // Filter entries with anxiety data
  const withAnxiety = entries.filter(e => e.anxietyLevel != null);
  if (withAnxiety.length < 10) return [];

  // Group by anxiety level (low: 1-3, medium: 4-6, high: 7-10)
  const lowAnxiety = withAnxiety.filter(e => e.anxietyLevel <= 3);
  const medAnxiety = withAnxiety.filter(e => e.anxietyLevel >= 4 && e.anxietyLevel <= 6);
  const highAnxiety = withAnxiety.filter(e => e.anxietyLevel >= 7);

  // Calculate average time spent per anxiety level
  const avgTimeLow = lowAnxiety.length > 0 
    ? lowAnxiety.reduce((sum, e) => sum + (e.timeSpent || 0), 0) / lowAnxiety.length 
    : 0;
  const avgTimeMed = medAnxiety.length > 0
    ? medAnxiety.reduce((sum, e) => sum + (e.timeSpent || 0), 0) / medAnxiety.length
    : 0;
  const avgTimeHigh = highAnxiety.length > 0
    ? highAnxiety.reduce((sum, e) => sum + (e.timeSpent || 0), 0) / highAnxiety.length
    : 0;

  // Check for strong correlation (high anxiety = longer compulsions)
  if (highAnxiety.length > 3 && lowAnxiety.length > 3) {
    const ratio = avgTimeHigh / (avgTimeLow || 1);
    
    if (ratio > 1.5) {
      insights.push({
        pattern: 'high-anxiety-longer-compulsions',
        confidence: Math.min((ratio - 1) / 2, 1),
        statistics: {
          highAnxietyAvgTime: Math.round(avgTimeHigh),
          lowAnxietyAvgTime: Math.round(avgTimeLow),
          timeDifferencePercent: Math.round((ratio - 1) * 100),
          highAnxietyCount: highAnxiety.length,
        },
        timeframe: 'overall',
        category: 'anxiety-correlation',
      });
    }
  }

  // Check if anxiety levels are trending
  if (withAnxiety.length >= 15) {
    const sorted = [...withAnxiety].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, e) => sum + e.anxietyLevel, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, e) => sum + e.anxietyLevel, 0) / secondHalf.length;
    
    const diff = secondAvg - firstAvg;
    
    if (Math.abs(diff) > 1) {
      insights.push({
        pattern: diff > 0 ? 'anxiety-increasing' : 'anxiety-decreasing',
        confidence: Math.min(Math.abs(diff) / 3, 1),
        statistics: {
          trend: diff > 0 ? 'increasing' : 'decreasing',
          oldAverage: Math.round(firstAvg * 10) / 10,
          recentAverage: Math.round(secondAvg * 10) / 10,
          changeMagnitude: Math.round(Math.abs(diff) * 10) / 10,
        },
        timeframe: 'temporal-trend',
        category: 'anxiety-correlation',
      });
    }
  }

  return insights;
}

/**
 * Analyze target completion patterns
 */
function analyzeTargetPatterns(targets: any[]): InsightData[] {
  if (targets.length < 3) return [];

  const insights: InsightData[] = [];
  const completed = targets.filter(t => t.completed);
  const completionRate = (completed.length / targets.length) * 100;

  if (completionRate > 70) {
    insights.push({
      pattern: 'high-target-completion',
      confidence: completionRate / 100,
      statistics: {
        completionRate: Math.round(completionRate),
        completedCount: completed.length,
        totalTargets: targets.length,
      },
      timeframe: 'overall',
      category: 'target-pattern',
    });
  } else if (completionRate < 30 && targets.length > 5) {
    insights.push({
      pattern: 'low-target-completion',
      confidence: (100 - completionRate) / 100,
      statistics: {
        completionRate: Math.round(completionRate),
        completedCount: completed.length,
        totalTargets: targets.length,
      },
      timeframe: 'overall',
      category: 'target-pattern',
    });
  }

  return insights;
}

/**
 * Analyze panic session effectiveness
 */
function analyzePanicSessionEffectiveness(panicEvents: any[], journalEntries: any[]): InsightData[] {
  if (panicEvents.length < 5) return [];

  const insights: InsightData[] = [];
  
  // Check if days with panic sessions have fewer/shorter compulsions
  const daysWithPanic = new Set(
    panicEvents.map(p => new Date(p.createdAt).toDateString())
  );
  
  const daysWithoutPanic = new Set(
    journalEntries
      .map(e => new Date(e.createdAt).toDateString())
      .filter(date => !daysWithPanic.has(date))
  );

  const compulsionsOnPanicDays = journalEntries.filter(e => 
    daysWithPanic.has(new Date(e.createdAt).toDateString())
  );
  
  const compulsionsOnNonPanicDays = journalEntries.filter(e =>
    daysWithoutPanic.has(new Date(e.createdAt).toDateString())
  );

  if (compulsionsOnPanicDays.length > 0 && compulsionsOnNonPanicDays.length > 0) {
    const avgTimePanicDays = compulsionsOnPanicDays.reduce((sum, e) => sum + (e.timeSpent || 0), 0) 
      / compulsionsOnPanicDays.length;
    const avgTimeNonPanicDays = compulsionsOnNonPanicDays.reduce((sum, e) => sum + (e.timeSpent || 0), 0)
      / compulsionsOnNonPanicDays.length;

    const difference = ((avgTimeNonPanicDays - avgTimePanicDays) / avgTimeNonPanicDays) * 100;

    if (difference > 15) {
      insights.push({
        pattern: 'panic-sessions-reduce-compulsion-time',
        confidence: Math.min(difference / 50, 1),
        statistics: {
          avgTimeWithPanicSessions: Math.round(avgTimePanicDays),
          avgTimeWithoutPanicSessions: Math.round(avgTimeNonPanicDays),
          reductionPercent: Math.round(difference),
          panicSessionCount: panicEvents.length,
        },
        timeframe: 'overall',
        category: 'panic-effectiveness',
      });
    }
  }

  return insights;
}

/**
 * Main analysis function - generates all behavioral insights
 */
export async function analyzeBehavioralPatterns(data: {
  journalEntries: any[];
  panicEvents: any[];
  targets: any[];
  moods?: any[];
}): Promise<BehavioralAnalysis> {
  const { journalEntries, panicEvents, targets } = data;

  // Calculate data quality metrics
  const oldestEntry = journalEntries.length > 0
    ? Math.min(...journalEntries.map(e => new Date(e.createdAt).getTime()))
    : Date.now();
  const daysOfData = Math.max(1, Math.floor((Date.now() - oldestEntry) / (1000 * 60 * 60 * 24)));
  
  const completeness = Math.min(
    (journalEntries.length / (daysOfData * 2)) + // Expect ~2 entries per day
    (panicEvents.length / (daysOfData * 0.5)) + // Expect ~0.5 panic sessions per day
    (targets.length / (daysOfData * 0.3)), // Expect ~0.3 targets per day
    1
  );

  // Run all pattern detection algorithms
  const allInsights: InsightData[] = [
    ...analyzeTimePatterns(journalEntries),
    ...analyzeTriggerPatterns(journalEntries),
    ...analyzeAnxietyCorrelations(journalEntries),
    ...analyzeTargetPatterns(targets),
    ...analyzePanicSessionEffectiveness(panicEvents, journalEntries),
  ];

  // Sort by confidence
  allInsights.sort((a, b) => b.confidence - a.confidence);

  return {
    insights: allInsights,
    dataQuality: {
      entriesAnalyzed: journalEntries.length + panicEvents.length + targets.length,
      daysOfData,
      completeness: Math.round(completeness * 100) / 100,
    },
  };
}

/**
 * Get top N insights for display
 */
export function getTopInsights(analysis: BehavioralAnalysis, limit: number = 3): InsightData[] {
  return analysis.insights
    .filter(insight => insight.confidence > 0.4) // Only show insights with >40% confidence
    .slice(0, limit);
}
