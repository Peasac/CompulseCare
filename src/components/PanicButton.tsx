import { useState } from "react";
import { Button } from "@/components/ui/button";

import CalmingSession from "./CalmingSession";

const PanicButton = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);

  const handlePanicClick = () => {
    setIsSessionActive(true);
  };

  const handleSessionEnd = () => {
    setIsSessionActive(false);
  };

  if (isSessionActive) {
    return <CalmingSession onEnd={handleSessionEnd} />;
  }

  return (
    <div className="relative">
      <Button
        onClick={handlePanicClick}
        className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full bg-panic text-panic-foreground hover:bg-panic/90  shadow-card animate-breathe flex flex-col items-center justify-center gap-3 md:gap-4 transition-smooth"
      >
        
        <span className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide">
          Panic
        </span>
      </Button>
      <div className="absolute inset-0 rounded-full bg-panic/20 -z-10 animate-pulse-glow" />
    </div>
  );
};

export default PanicButton;
