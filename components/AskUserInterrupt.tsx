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
    <div className="mx-auto w-full max-w-[var(--thread-max-width)] px-4 py-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Goopie needs your input</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {questions.map((q, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              <Label className="text-base">{q.question}</Label>

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
              />
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit} className="w-full">
            Submit
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
