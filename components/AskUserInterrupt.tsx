"use client";

import { useState } from "react";
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
    // Format answers as numbered list: "1. answer1\n\n2. answer2\n\n3. answer3"
    const formattedAnswers = questions
      .map((_, idx) => `${idx + 1}. ${answers[idx] || ""}`)
      .join("\n\n");

    // Resume the execution with the formatted answers
    sendCommand({ resume: formattedAnswers });

    // Clear the form
    setAnswers({});
  };

  return (
    <div className="mx-auto w-full max-w-[var(--thread-max-width)] px-4 py-6">
      <Card className="w-full overflow-hidden rounded-2xl border-primary/20 bg-primary/5 shadow-md dark:border-primary/20 dark:bg-primary/10">
        <CardHeader className="border-b border-primary/10 bg-primary/10 px-6 py-4 dark:border-primary/20 dark:bg-primary/10">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <span className="text-sm font-bold">?</span>
            </div>
            <CardTitle className="text-lg font-semibold text-foreground">
              Goopie needs your input
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 p-6">
          {questions.map((q, idx) => (
            <div key={idx} className="flex flex-col gap-3">
              <Label className="text-base leading-relaxed font-medium whitespace-pre-wrap text-foreground">
                {q.question.replace(/\\n/g, "\n")}
              </Label>

              {/* Show suggested answers as clickable buttons */}
              {q.suggested_answers && q.suggested_answers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {q.suggested_answers.map((ans) => (
                    <Button
                      key={ans}
                      variant={answers[idx] === ans ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [idx]: ans }))
                      }
                      className={
                        answers[idx] === ans
                          ? "bg-primary hover:bg-primary/90"
                          : "bg-background hover:bg-muted"
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
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [idx]: e.target.value }))
                }
                placeholder="Type your answer..."
                className="h-11 rounded-xl border-input bg-background px-4 shadow-sm transition-all focus-visible:ring-primary/20"
              />
            </div>
          ))}
        </CardContent>
        <CardFooter className="border-t border-primary/10 bg-primary/5 px-6 py-4 dark:border-primary/20 dark:bg-primary/5">
          <Button
            onClick={handleSubmit}
            className="ml-auto bg-primary px-8 font-medium text-primary-foreground shadow-md hover:bg-primary/90"
            size="lg"
          >
            Submit Answers
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
