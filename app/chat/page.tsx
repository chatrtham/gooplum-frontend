"use client";

import { MyAssistant } from "@/components/MyAssistant";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { Navigation } from "@/components/Navigation";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <motion.div
          className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Link href="/">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                    >
                      <ArrowLeftIcon className="size-4" />
                    </Button>
                  </Link>
                </motion.div>
                <motion.h1
                  className="text-xl font-semibold text-foreground"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  Goopie AI
                </motion.h1>
              </div>
              <Navigation />
            </div>

            <motion.div
              className="text-sm text-muted-foreground"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Your intelligent flow creation assistant
            </motion.div>
          </div>
        </motion.div>
      </header>

      {/* Chat Interface */}
      <main className="h-[calc(100vh-4rem)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="h-full"
        >
          <MyAssistant />
        </motion.div>
      </main>
    </div>
  );
}
