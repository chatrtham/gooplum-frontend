"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutGridIcon, BotIcon } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Flows", icon: LayoutGridIcon },
    { href: "/agents", label: "Agents", icon: BotIcon },
  ];

  return (
    <nav className="flex items-center gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        // Exact match for root, prefix match for others
        const isActive =
          href === "/" ? pathname === "/" : pathname.startsWith(href);

        return (
          <Link key={href} href={href}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "gap-2",
                isActive && "bg-secondary text-secondary-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}
