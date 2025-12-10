"use client";

import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { CheckIcon } from "lucide-react";
import MarkdownPreview from "@uiw/react-markdown-preview";

/**
 * AskUserToolUI displays the ask_user tool call after execution.
 *
 * This shows:
 * 1. What questions were asked
 * 2. What answers the user provided (from the result)
 *
 * Note: The actual user interaction happens via AskUserInterrupt component.
 * This is purely a display component for the completed tool call.
 */

type QuestionItem = {
  question: string;
  suggested_answers?: string[];
};

type AskUserArgs = {
  questions: QuestionItem[];
};

export const AskUserToolUI: ToolCallMessagePartComponent<
  AskUserArgs,
  string
> = ({ args, result }) => {
  // Don't render anything until we have a result
  // The AskUserInterrupt component handles the input UI
  if (!result) {
    return null;
  }

  const questions = args?.questions ?? [];

  // Parse the result string - format is "1. answer1\n\n2. answer2\n\n3. answer3"
  // We use a regex lookahead to split only when followed by a number and a dot,
  // to avoid splitting on double newlines within an answer.
  const answers = result
    .split(/\n\n(?=\d+\.\s)/)
    .map((line: string) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  return (
    <div className="mb-4 flex w-full flex-col gap-6 rounded-xl border border-border/60 bg-card/50 py-6 shadow-sm backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center gap-3 px-6">
        <div className="flex size-6 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
          <CheckIcon className="size-3.5" />
        </div>
        <p className="text-sm font-medium tracking-tight text-foreground">
          Questions answered
        </p>
      </div>

      {/* Questions and Answers */}
      <div className="flex flex-col gap-6 px-6">
        {questions.map((q: QuestionItem, idx: number) => (
          <div key={idx} className="flex flex-col gap-2">
            <div className="flex gap-2 text-sm font-normal text-muted-foreground">
              <span className="shrink-0">{idx + 1}.</span>
              <MarkdownPreview
                source={q.question.replace(/\\n/g, "\n")}
                style={{
                  backgroundColor: "transparent",
                  color: "inherit",
                  fontSize: "inherit",
                }}
                wrapperElement={{
                  "data-color-mode": "light",
                }}
                className="prose dark:prose-invert max-w-none !bg-transparent !text-inherit [&>p]:mb-2 [&>p:last-child]:mb-0"
              />
            </div>
            {answers[idx] && (
              <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 font-mono text-sm whitespace-pre-wrap text-foreground/90">
                {answers[idx].replace(/\\n/g, "\n")}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
