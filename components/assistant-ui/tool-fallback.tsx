import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { CheckIcon, RefreshCwIcon } from "lucide-react";

export const ToolFallback: ToolCallMessagePartComponent = ({
  toolName,
  result,
}) => {
  const isLoading = result === undefined;

  return (
    <div className="aui-tool-fallback-root mb-3 flex items-center gap-3 rounded-xl border border-border/40 bg-muted/20 px-4 py-3 transition-all duration-150">
      <div className="flex size-5 items-center justify-center rounded-full bg-background">
        {isLoading ? (
          <RefreshCwIcon className="aui-tool-fallback-loading size-3.5 animate-spin text-muted-foreground" />
        ) : (
          <CheckIcon className="aui-tool-fallback-success size-3.5 text-secondary" />
        )}
      </div>
      <p className="aui-tool-fallback-title text-sm text-foreground/80">
        {isLoading ? "Using" : "Used"}{" "}
        <span className="font-medium text-foreground">{toolName}</span>
      </p>
    </div>
  );
};
