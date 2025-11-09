"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function CreateFlowButton() {
  return (
    <Link href="/create">
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        Create New Flow
      </Button>
    </Link>
  );
}
