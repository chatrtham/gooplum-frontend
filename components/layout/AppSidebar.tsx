"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { BotIcon, WorkflowIcon } from "lucide-react";

export function AppSidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Flows", icon: WorkflowIcon },
    { href: "/agents", label: "Agents", icon: BotIcon },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="group relative flex w-16 flex-col border-r border-border/60 bg-sidebar text-sidebar-foreground transition-all duration-150 ease-out">
        {/* Logo */}
        <div className="flex h-14 items-center justify-center px-2 pb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/"
                className="flex cursor-pointer items-center justify-center text-foreground transition-colors duration-150 hover:text-primary"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-[0.98]">
                  {/* Color placeholder for logo */}
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">GoopLum</TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3">
          <div className="grid gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>
                    <Link href={href}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "w-full cursor-pointer transition-all duration-150 ease-out",
                          isActive
                            ? "border border-secondary/30 bg-secondary/20 font-medium text-secondary"
                            : "text-muted-foreground hover:bg-secondary/10 hover:text-secondary",
                        )}
                      >
                        <Icon className="size-5" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </nav>
      </aside>
    </TooltipProvider>
  );
}
