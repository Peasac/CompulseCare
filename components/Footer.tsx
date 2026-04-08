"use client";

import Link from "next/link";

/**
 * Footer - Shared footer component
 * Simple and clean design
 */
const Footer = () => {
  return (
    <footer className="border-t border-border mt-12 py-6 bg-card">
      <div className="container mx-auto px-4 text-center space-y-3">
        <p className="text-sm text-foreground">
          CompulseCare © {new Date().getFullYear()} • Your journey to wellness
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:text-primary transition-colors">
            Privacy
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-primary transition-colors">
            Terms
          </Link>
          <span>•</span>
          <Link href="/support" className="hover:text-primary transition-colors">
            Support
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          This app is not a substitute for professional mental health care
        </p>
      </div>
    </footer>
  );
};

export default Footer;

// Commit message: feat: create Footer component with links and disclaimer
