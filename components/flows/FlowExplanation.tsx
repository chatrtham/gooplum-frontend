import React from "react";
import MarkdownPreview from "@uiw/react-markdown-preview";
import "@/app/flow/[id]/markdown.css";

interface FlowExplanationProps {
  explanation: string;
}

export function FlowExplanation({ explanation }: FlowExplanationProps) {
  return (
    <div className="prose dark:prose-invert max-w-none p-4">
      <MarkdownPreview
        source={explanation}
        style={{ backgroundColor: "transparent" }}
      />
    </div>
  );
}
