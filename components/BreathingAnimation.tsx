"use client";

/**
 * BreathingAnimation - Placeholder for breathing exercise animation
 * TODO: Integrate Lottie animation library for production
 * npm install lottie-react
 * Place breathing.json animation file in /public/animations/
 */
const BreathingAnimation = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Simple CSS-based breathing circle as placeholder */}
      <div className="relative w-48 h-48 md:w-64 md:h-64">
        <div 
          className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-info opacity-70 animate-breatheInOut"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-background text-xl md:text-2xl font-semibold text-center">
            Breathe
          </p>
        </div>
      </div>
      
      {/* Breathing instructions */}
      <div className="mt-8 text-center space-y-2">
        <p className="text-lg md:text-xl font-medium text-foreground">
          Follow the circle
        </p>
        <p className="text-sm md:text-base text-muted-foreground">
          Breathe in as it grows, out as it shrinks
        </p>
      </div>

      {/* TODO: Replace with Lottie when ready */}
      {/* 
      import Lottie from 'lottie-react';
      import breathingAnimation from '@/public/animations/breathing.json';
      
      <Lottie 
        animationData={breathingAnimation}
        loop={true}
        className="w-64 h-64"
      />
      */}
    </div>
  );
};

export default BreathingAnimation;

// Commit message: feat: add breathing animation placeholder with CSS fallback and Lottie integration notes
