"use client";

import { MyAssistant } from "@/components/MyAssistant";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-4">
                <div>
                  <Link href="/">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                    >
                      <ArrowLeftIcon className="size-4" />
                    </Button>
                  </Link>
                </div>
                <h1 className="text-xl font-semibold text-foreground">
                  Goopie AI
                </h1>
              </div>
              <Navigation />
            </div>

            <div className="text-sm text-muted-foreground">
              Your intelligent flow creation assistant
            </div>
          </div>
        </div>
      </header>

      {/* Chat Interface */}
      <main className="h-[calc(100vh-4rem)]">
        <div className="h-full">
          <MyAssistant />
        </div>
      </main>
    </div>
  );
}
