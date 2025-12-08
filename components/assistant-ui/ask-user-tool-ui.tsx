"use client";

import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { CheckIcon } from "lucide-react";

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
  const answers = result
    .split("\n\n")
    .map((line: string) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  return (
    <div className="mb-4 flex w-full flex-col gap-3 rounded-xl border border-border bg-card py-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-5">
        <div className="flex size-6 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400">
          <CheckIcon className="size-3.5" />
        </div>
        <p className="text-sm font-semibold text-foreground">
          Questions answered
        </p>
      </div>

      {/* Questions and Answers */}
      <div className="flex flex-col gap-4 border-t border-border/50 pt-4">
        {questions.map((q: QuestionItem, idx: number) => (
          <div key={idx} className="flex flex-col gap-2 px-5">
            <p className="text-sm font-medium text-muted-foreground">
              {idx + 1}. {q.question.replace(/\\n/g, "\n")}
            </p>
            {answers[idx] && (
              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-foreground shadow-sm">
                {answers[idx].replace(/\\n/g, "\n")}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
