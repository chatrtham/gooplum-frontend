"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface FlowSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function FlowSearch({
  value,
  onChange,
  placeholder = "Search flows...",
}: FlowSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}
