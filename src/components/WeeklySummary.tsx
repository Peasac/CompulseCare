import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingDown, TrendingUp, Calendar } from "lucide-react";
import { toast } from "sonner";

const WeeklySummary = () => {
  const handleExport = () => {
    toast.success("Weekly summary exported as PDF!");
  };

  return (
    <Card className="p-6 shadow-card animate-fade-slide-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Weekly Summary</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Panic Episodes</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">10</p>
              <Badge variant="outline" className="bg-success/20">
                <TrendingDown className="w-3 h-3 mr-1" />
                30%
              </Badge>
            </div>
          </div>

          <div className="p-3 bg-secondary/10 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Journal Entries</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">6</p>
              <Badge variant="outline" className="bg-success/20">
                <TrendingUp className="w-3 h-3 mr-1" />
                20%
              </Badge>
            </div>
          </div>

          <div className="p-3 bg-success/10 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Target Completion</p>
            <p className="text-2xl font-bold">85%</p>
          </div>

          <div className="p-3 bg-panic/10 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Avg Anxiety</p>
            <p className="text-2xl font-bold">4.5/10</p>
          </div>
        </div>

        {/* AI Insights */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h3 className="text-sm font-semibold mb-2">💡 Insights</h3>
          <ul className="text-xs space-y-2 text-muted-foreground">
            <li>• You reduced checking compulsions by 30% this week—great progress!</li>
            <li>• Your anxiety spikes correlate with evening hours. Consider a wind-down routine.</li>
            <li>• Mood improved on days when you completed exposure targets.</li>
          </ul>
        </div>

        {/* Common Triggers */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Common Triggers</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Organizing</Badge>
            <Badge variant="outline">Social Events</Badge>
            <Badge variant="outline">Work Stress</Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default WeeklySummary;
