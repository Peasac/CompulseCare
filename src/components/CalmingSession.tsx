import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface CalmingSessionProps {
  onEnd: () => void;
}

const reassuranceMessages = [
  "This feeling is temporary. You are safe.",
  "You've managed similar moments before. You can do this.",
  "Focus on your breath. In... and out.",
  "Your body knows how to calm down. Trust the process.",
  "You are stronger than this moment. One breath at a time.",
  "This will pass. You are in control.",
];

const CalmingSession = ({ onEnd }: CalmingSessionProps) => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [holdingExit, setHoldingExit] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % reassuranceMessages.length);
    }, 10000);

    const sessionTimer = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(messageTimer);
      clearInterval(sessionTimer);
    };
  }, []);

  useEffect(() => {
    let progressTimer: NodeJS.Timeout;
    if (holdingExit) {
      progressTimer = setInterval(() => {
        setHoldProgress((prev) => {
          if (prev >= 100) {
            onEnd();
            return 100;
          }
          return prev + 5;
        });
      }, 100);
    } else {
      setHoldProgress(0);
    }
    return () => clearInterval(progressTimer);
  }, [holdingExit, onEnd]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 gradient-breathing flex items-center justify-center p-4">
      {/* Exit Button */}
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-background/20 backdrop-blur-sm text-foreground hover:bg-background/30 relative overflow-hidden"
          onMouseDown={() => setHoldingExit(true)}
          onMouseUp={() => setHoldingExit(false)}
          onMouseLeave={() => setHoldingExit(false)}
          onTouchStart={() => setHoldingExit(true)}
          onTouchEnd={() => setHoldingExit(false)}
        >
          <div
            className="absolute inset-0 bg-background/40 transition-all"
            style={{ transform: `scaleY(${holdProgress / 100})`, transformOrigin: "bottom" }}
          />
          <X className="w-5 h-5 relative z-10" />
        </Button>
        <p className="text-xs text-center mt-1 text-foreground/70">Hold 2s</p>
      </div>

      {/* Session Timer */}
      <div className="absolute top-4 left-4 bg-background/20 backdrop-blur-sm px-4 py-2 rounded-full">
        <p className="text-sm font-medium text-foreground">
          {formatTime(sessionTime)}
        </p>
      </div>

      {/* Breathing Circle */}
      <div className="relative flex flex-col items-center gap-8">
        <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-background/30 backdrop-blur-md animate-breathing-circle flex items-center justify-center shadow-card">
          <div className="text-center">
            <p className="text-xl md:text-3xl font-bold text-foreground mb-2">
              Breathe
            </p>
            <p className="text-sm md:text-base text-foreground/80">
              4-7-8 Technique
            </p>
          </div>
        </div>

        {/* Reassurance Message */}
        <div className="max-w-md text-center animate-fade-slide-in">
          <p className="text-base md:text-lg text-foreground px-6 leading-relaxed">
            {reassuranceMessages[currentMessage]}
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-background/20 backdrop-blur-sm rounded-xl p-4 md:p-6 max-w-sm">
          <h3 className="font-semibold text-foreground mb-3">Follow along:</h3>
          <ol className="space-y-2 text-sm text-foreground/90">
            <li>• Breathe in for 4 seconds</li>
            <li>• Hold for 7 seconds</li>
            <li>• Exhale for 8 seconds</li>
            <li>• Repeat</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default CalmingSession;
