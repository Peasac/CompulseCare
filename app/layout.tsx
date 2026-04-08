import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";

const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CompulseCare - OCD & Compulsion Tracking",
  description: "Your compassionate companion for managing OCD and compulsive behaviors. Track, understand, and grow.",
  keywords: ["OCD", "mental health", "compulsion tracking", "anxiety", "wellness"],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${manrope.className} bg-background`}>
        <ErrorBoundary>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

// Commit message: feat: create root layout with Inter font and metadata
