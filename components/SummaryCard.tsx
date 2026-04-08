"use client";

import { Card } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface WeeklyStat {
  label: string;
  value: number;
  change?: number; // percentage change from last week
  unit?: string;
}

interface SummaryCardProps {
  title: string;
  stats: WeeklyStat[];
  llmInsight?: string;
}

/**
 * SummaryCard - Display weekly statistics with trends
 * Shows key metrics and LLM-generated insights
 */
const SummaryCard = ({ title, stats, llmInsight }: SummaryCardProps) => {
  const getTrendIcon = (change?: number) => {
    if (!change) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (change > 0) return <TrendingUp className="w-4 h-4 text-panic" />;
    return <TrendingDown className="w-4 h-4 text-success" />;
  };

  const getTrendColor = (change?: number) => {
    if (!change) return "text-muted-foreground";
    if (change > 0) return "text-panic";
    return "text-success";
  };

  return (
    <Card className="p-6 bg-card border-border shadow-soft">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>

      {/* Stats Grid */}
      <div className="space-y-4 mb-4">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{stat.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-foreground">
                {stat.value}
                {stat.unit && <span className="text-sm font-normal ml-1">{stat.unit}</span>}
              </span>
              {stat.change !== undefined && (
                <div className="flex items-center gap-1">
                  {getTrendIcon(stat.change)}
                  <span className={`text-xs font-medium ${getTrendColor(stat.change)}`}>
                    {Math.abs(stat.change)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* LLM Insight */}
      {llmInsight && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-foreground leading-relaxed italic">
            "{llmInsight}"
          </p>
        </div>
      )}
    </Card>
  );
};

export default SummaryCard;

// Commit message: feat: create SummaryCard component for weekly stats with trend indicators
