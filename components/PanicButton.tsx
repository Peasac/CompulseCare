"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

interface PanicButtonProps {
  onPanicClick?: () => void;
}

/**
 * PanicButton - Large circular button for panic mode activation
 * Mobile-first design with soft red color (#FFADAD)
 * Features breathing animation and accessibility support
 */
const PanicButton = ({ onPanicClick }: PanicButtonProps) => {
  const handleClick = () => {
    if (onPanicClick) {
      onPanicClick();
    }
  };

  return (
    <div className="relative flex items-center justify-center p-4">
      <Button
        onClick={handleClick}
        aria-label="Activate panic mode for immediate support"
        className="
          w-56 h-56 
          sm:w-64 sm:h-64 
          md:w-80 md:h-80 
          lg:w-96 lg:h-96
          rounded-full 
          bg-rose-400
          hover:bg-rose-500
          text-white
          shadow-2xl 
          hover:shadow-3xl
          transition-all 
          duration-300 
          flex 
          flex-col 
          items-center 
          justify-center 
          gap-2 
          border-4
          border-white/20
          group
          active:scale-95
        "
        style={{
          animation: "breathe 4s ease-in-out infinite",
        }}
      >
        <span className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-wide">
          Panic
        </span>
        <span className="text-xs md:text-sm opacity-90">
          Tap for help
        </span>
      </Button>

      {/* Pulsing glow effect */}
      <div
        className="absolute inset-0 rounded-full bg-rose-400 opacity-20 -z-10 blur-2xl"
        style={{
          animation: "pulse 3s ease-in-out infinite",
        }}
      />
    </div>
  );
};

export default PanicButton;

// Commit message: feat: create mobile-first PanicButton component with accessibility and breathing animation
