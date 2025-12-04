"use client";

import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import {
  CheckIcon,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ToolFallback } from "@/components/assistant-ui/tool-fallback";
import { FlowExplanation } from "@/components/flows/FlowExplanation";

// Expected artifact structure from flow_compiler tool
interface FlowCompilerArtifact {
  flow_id: string;
  flow_name: string;
  flow_description: string;
  flow_explanation: string;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:2024";

async function activateFlow(flowId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${BASE_URL}/flows/${flowId}/activate`, {
    method: "POST",
  });
  return response.json();
}

export const FlowCompilerToolUI: ToolCallMessagePartComponent<
  Record<string, unknown>,
  string
> = (props) => {
  // The artifact is passed as a separate prop from LangGraph ToolMessage
  const { artifact } = props as { artifact?: FlowCompilerArtifact };
  const router = useRouter();
  const [isActivating, setIsActivating] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

  console.log("FlowCompilerToolUI - props:", props);
  console.log("FlowCompilerToolUI - artifact:", artifact);

  // If no artifact or missing flow_id, use fallback
  if (!artifact || !artifact.flow_id) {
    return <ToolFallback {...props} />;
  }

  const { flow_id, flow_name, flow_description, flow_explanation } = artifact;

  const handleCreateFlow = async () => {
    setIsActivating(true);
    try {
      const response = await activateFlow(flow_id);
      if (response.success) {
        setIsActivated(true);
        // Navigate to the flow page after a short delay
        setTimeout(() => {
          router.push(`/flow/${flow_id}`);
        }, 500);
      }
    } catch (error) {
      console.error("Failed to activate flow:", error);
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="mb-4 flex w-full flex-col gap-4 rounded-lg border border-border bg-muted/30 py-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-4">
        <Sparkles className="size-5 text-primary" />
        <p className="text-base font-semibold">Flow Ready</p>
      </div>

      {/* Flow Info */}
      <div className="flex flex-col gap-2 border-t border-border/50 px-4 pt-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Name</p>
          <p className="font-medium text-foreground">{flow_name}</p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Description</p>
          <p className="text-sm text-foreground">{flow_description}</p>
        </div>
      </div>

      {/* Explanation */}
      {flow_explanation && (
        <div className="flex flex-col border-t border-border/50 px-4 pt-4">
          <button
            onClick={() => setIsExplanationOpen(!isExplanationOpen)}
            className="flex w-full items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {isExplanationOpen ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
            How it works
          </button>
          {isExplanationOpen && (
            <div className="mt-2">
              <FlowExplanation explanation={flow_explanation} />
            </div>
          )}
        </div>
      )}

      {/* Create Flow Button */}
      <div className="flex justify-end border-t border-border/50 px-4 pt-4">
        <Button
          onClick={handleCreateFlow}
          disabled={isActivating || isActivated}
          className="gap-2"
        >
          {isActivating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating...
            </>
          ) : isActivated ? (
            <>
              <CheckIcon className="size-4" />
              Created
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Create Flow
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
