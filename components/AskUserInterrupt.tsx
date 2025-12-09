"use client";

import { useState, useEffect } from "react";
import {
  useLangGraphInterruptState,
  useLangGraphSendCommand,
} from "@assistant-ui/react-langgraph";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";
import MarkdownPreview from "@uiw/react-markdown-preview";

type QuestionItem = {
  question: string;
  suggested_answers?: string[];
};

type AskUserInterruptValue = {
  questions: QuestionItem[];
};

export const AskUserInterrupt = () => {
  const interrupt = useLangGraphInterruptState();
  const sendCommand = useLangGraphSendCommand();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when a new interrupt arrives (new questions)
  useEffect(() => {
    setAnswers({});
    setIsSubmitting(false);
  }, [interrupt?.value]);

  // Only show when there's an interrupt with questions
  if (!interrupt?.value) return null;

  // Parse the interrupt value - our backend sends { questions: [...] }
  const interruptValue = interrupt.value as AskUserInterruptValue;

  // Check if this is an ask_user interrupt (has questions array)
  if (!interruptValue?.questions || !Array.isArray(interruptValue.questions)) {
    return null;
  }

  const questions = interruptValue.questions;

  const handleSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Format answers as numbered list: "1. answer1\n\n2. answer2\n\n3. answer3"
    const formattedAnswers = questions
      .map((_, idx) => `${idx + 1}. ${answers[idx] || ""}`)
      .join("\n\n");

    // Resume the execution with the formatted answers
    sendCommand({ resume: formattedAnswers });
  };

  return (
    <div className="mx-auto w-full max-w-[var(--thread-max-width)] px-4 py-2">
      <Card className="w-full overflow-hidden rounded-xl border border-border/60 bg-card/50 shadow-sm backdrop-blur-md">
        <CardHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
              <span className="text-sm font-bold">?</span>
            </div>
            <CardTitle className="text-lg font-medium tracking-tight text-foreground">
              Goopie needs your input
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-8 p-6">
          {questions.map((q, idx) => (
            <div key={idx} className="flex flex-col gap-3">
              <div className="text-sm leading-relaxed font-normal text-foreground/90">
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

              {/* Show suggested answers as clickable buttons */}
              {q.suggested_answers && q.suggested_answers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {q.suggested_answers.map((ans) => (
                    <Button
                      key={ans}
                      variant={answers[idx] === ans ? "default" : "outline"}
                      size="sm"
                      disabled={isSubmitting}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [idx]: ans }))
                      }
                      className={
                        answers[idx] === ans
                          ? "bg-primary hover:bg-primary/90"
                          : "border-input bg-background hover:bg-muted"
                      }
                    >
                      {ans}
                    </Button>
                  ))}
                </div>
              )}

              {/* Always show text input for custom answers */}
              <Input
                value={answers[idx] || ""}
                disabled={isSubmitting}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [idx]: e.target.value }))
                }
                placeholder="Type your answer..."
                className="h-10 rounded-md border-input bg-background/50 px-3 font-mono text-sm shadow-sm transition-all focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          ))}
        </CardContent>
        <CardFooter className="px-6 pt-0 pb-6">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="ml-auto h-9 bg-primary px-6 font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            size="sm"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="mr-2 size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Answers"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
