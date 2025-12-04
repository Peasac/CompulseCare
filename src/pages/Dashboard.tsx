import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, FileText, Target, BarChart3, Smile } from "lucide-react";
import PanicButton from "@/components/PanicButton";
import CompulsionLogger from "@/components/CompulsionLogger";
import TargetsSection from "@/components/TargetsSection";
import MoodTracker from "@/components/MoodTracker";
import ChartsSection from "@/components/ChartsSection";
import WeeklySummary from "@/components/WeeklySummary";

const Dashboard = () => {
  const [userName] = useState("Ayaan");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome, {userName} 👋
              </h1>
              <p className="text-sm text-muted-foreground">
                You're doing great. One step at a time.
              </p>
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export All Data</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Three Column Layout: Logger - Panic Button - Targets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-12">
          {/* Left Column - Compulsion Logger */}
          <div className="order-2 lg:order-1">
            <CompulsionLogger />
          </div>

          {/* Center Column - Panic Button */}
          <div className="order-1 lg:order-2 flex justify-center items-center min-h-[400px]">
            <PanicButton />
          </div>

          {/* Right Column - Targets */}
          <div className="order-3 lg:order-3">
            <TargetsSection />
          </div>
        </div>

        {/* Second Row - Charts and Weekly Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartsSection />
          <WeeklySummary />
        </div>

        {/* Mood Tracker - Full Width */}
        <section className="mt-8">
          <MoodTracker />
        </section>

        {/* Feature Cards - Mobile */}
        <div className="lg:hidden mt-8 grid grid-cols-2 gap-4">
          <Card className="p-4 text-center shadow-soft">
            <Target className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-xs font-medium">Targets</p>
          </Card>
          <Card className="p-4 text-center shadow-soft">
            <BarChart3 className="w-6 h-6 mx-auto mb-2 text-secondary" />
            <p className="text-xs font-medium">Analytics</p>
          </Card>
          <Card className="p-4 text-center shadow-soft">
            <Smile className="w-6 h-6 mx-auto mb-2 text-success" />
            <p className="text-xs font-medium">Mood</p>
          </Card>
          <Card className="p-4 text-center shadow-soft">
            <FileText className="w-6 h-6 mx-auto mb-2 text-accent" />
            <p className="text-xs font-medium">Journal</p>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>CompulseCare © 2025 • Your journey to wellness</p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
