"use client";

import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { ToolFallback } from "@/components/assistant-ui/tool-fallback";
import { FlowExecutionToolUI } from "@/components/assistant-ui/flow-execution-tool-ui";
import { isFlowExecutionArtifact } from "@/lib/agentFlowExecutionApi";

/**
 * A smart tool fallback component for agent conversations.
 *
 * It checks if the tool call has a flow_execution_request artifact
 * and renders the FlowExecutionToolUI for streaming execution.
 * Otherwise, it renders the standard ToolFallback.
 */
export const AgentToolFallback: ToolCallMessagePartComponent = (props) => {
  const { artifact, toolName, argsText, result } = props;

  // Check if this is a flow execution request
  if (isFlowExecutionArtifact(artifact)) {
    return (
      <FlowExecutionToolUI
        artifact={artifact}
        toolName={toolName}
        argsText={argsText}
        result={result}
      />
    );
  }

  // Default to standard tool fallback
  return <ToolFallback {...props} />;
};
