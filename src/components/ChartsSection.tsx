import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, BarChart3 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

const anxietyData = [
  { day: "Mon", level: 7 },
  { day: "Tue", level: 5 },
  { day: "Wed", level: 6 },
  { day: "Thu", level: 4 },
  { day: "Fri", level: 3 },
  { day: "Sat", level: 4 },
  { day: "Sun", level: 5 },
];

const panicData = [
  { day: "Mon", count: 3 },
  { day: "Tue", count: 2 },
  { day: "Wed", count: 1 },
  { day: "Thu", count: 2 },
  { day: "Fri", count: 1 },
  { day: "Sat", count: 0 },
  { day: "Sun", count: 1 },
];

const ChartsSection = () => {
  const handleExport = () => {
    toast.success("Charts exported as PNG!");
  };

  return (
    <Card className="p-6 shadow-card animate-fade-slide-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Analytics</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Anxiety Trends */}
        <div>
          <h3 className="text-sm font-medium mb-3">Anxiety Level Trends</h3>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={anxietyData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="level"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Panic Episodes */}
        <div>
          <h3 className="text-sm font-medium mb-3">Panic Episodes</h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={panicData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--panic))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};

export default ChartsSection;
