import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Download, Target, Flame } from "lucide-react";
import { toast } from "sonner";

interface TargetItem {
  id: string;
  title: string;
  category: "exposure" | "reduction" | "mindfulness";
  completed: boolean;
  streak: number;
}

const initialTargets: TargetItem[] = [
  {
    id: "1",
    title: "Touch doorknob without washing hands for 10 min",
    category: "exposure",
    completed: false,
    streak: 3,
  },
  {
    id: "2",
    title: "Limit checking to 2 times",
    category: "reduction",
    completed: true,
    streak: 7,
  },
  {
    id: "3",
    title: "10-minute meditation",
    category: "mindfulness",
    completed: false,
    streak: 14,
  },
];

const TargetsSection = () => {
  const [targets, setTargets] = useState(initialTargets);

  const handleToggle = (id: string) => {
    setTargets((prev) =>
      prev.map((target) =>
        target.id === id ? { ...target, completed: !target.completed } : target
      )
    );
    toast.success("Target updated!");
  };

  const handleExport = () => {
    toast.success("Target progress export started!");
  };

  const getCategoryColor = (category: TargetItem["category"]) => {
    switch (category) {
      case "exposure":
        return "bg-primary/20 text-primary-foreground";
      case "reduction":
        return "bg-secondary/20 text-secondary-foreground";
      case "mindfulness":
        return "bg-success/20 text-success-foreground";
    }
  };

  return (
    <Card className="p-6 shadow-card animate-fade-slide-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Daily Targets</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {targets.map((target) => (
          <div
            key={target.id}
            className={`p-3 border border-border rounded-lg transition-smooth ${
              target.completed ? "opacity-60 bg-muted/30" : "hover:bg-muted/20"
            }`}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={target.completed}
                onCheckedChange={() => handleToggle(target.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <p
                  className={`text-sm ${
                    target.completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {target.title}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className={getCategoryColor(target.category)}>
                    {target.category}
                  </Badge>
                  {target.streak > 0 && (
                    <Badge variant="outline" className="bg-destructive/10">
                      <Flame className="w-3 h-3 mr-1" />
                      {target.streak} days
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-success/10 rounded-lg text-center">
        <p className="text-sm font-medium text-success-foreground">
          🎉 7-day streak! Keep going!
        </p>
      </div>
    </Card>
  );
};

export default TargetsSection;
