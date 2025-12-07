"use client";

interface TemplateProps {
  children: React.ReactNode;
}

// Simplified template without page transitions
// The AnimatePresence/motion animations were causing layout issues
// during fast navigation (blank pages, double rendering)
export default function Template({ children }: TemplateProps) {
  return <>{children}</>;
}
