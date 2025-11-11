"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  TrashIcon,
  PlayIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface FlowDetails {
  id: string;
  name: string;
  description: string;
  lastExecuted?: string;
  inputs: FlowInput[];
  explanation: string;
}

interface FlowInput {
  id: string;
  name: string;
  label: string;
  type: "text" | "email" | "date" | "checkbox";
  placeholder?: string;
  defaultValue?: string | boolean;
  required?: boolean;
}

const mockFlowDetails: Record<string, FlowDetails> = {
  "1": {
    id: "1",
    name: "Send Daily Sales Report",
    description: "Daily Sales Report Flow",
    lastExecuted: "Yesterday at 9:00 AM",
    inputs: [
      {
        id: "email_recipients",
        name: "email_recipients",
        label: "Email Recipients",
        type: "email",
        placeholder: "team@company.com, manager@company.com",
        defaultValue: "team@company.com, manager@company.com",
        required: true,
      },
      {
        id: "report_date",
        name: "report_date",
        label: "Report Date",
        type: "date",
        defaultValue: new Date().toISOString().split("T")[0],
        required: true,
      },
      {
        id: "include_charts",
        name: "include_charts",
        label: "Include Charts",
        type: "checkbox",
        defaultValue: true,
      },
      {
        id: "include_raw_data",
        name: "include_raw_data",
        label: "Include Raw Data",
        type: "checkbox",
        defaultValue: false,
      },
    ],
    explanation: `# Daily Sales Report Flow

This automated flow generates comprehensive sales reports and delivers them to your team every morning.

## Process
1. **Data Collection** - Queries the sales database for yesterday's transactions, customer acquisitions, and revenue metrics
2. **Report Generation** - Creates a PDF with charts showing:
   - Total sales by product category
   - New customer acquisition trends
   - Revenue comparison with previous week
3. **Email Delivery** - Sends the report to specified recipients at 9:00 AM daily

## Integrations Used
- PostgreSQL Database (for sales data)
- PDF Generation Service
- SMTP Email Service

Last executed: Yesterday at 9:00 AM`,
  },
};

export default function FlowDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const flowId = params.id as string;
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [formData, setFormData] = useState<Record<string, string | boolean>>(
    {},
  );

  const flow = mockFlowDetails[flowId];

  // Initialize form data with default values - always call hook at top level
  useEffect(() => {
    if (flow) {
      const initialData: Record<string, string | boolean> = {};
      flow.inputs.forEach((input) => {
        initialData[input.name] = input.defaultValue || "";
      });
      setFormData(initialData);
    }
  }, [flow]);

  if (!flow) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-semibold">Flow Not Found</h1>
          <Link href="/">
            <Button>Back to Flows</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleInputChange = (name: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRunFlow = () => {
    // TODO: Implement flow execution
    console.log("Running flow with data:", formData);
    alert("Flow execution would be triggered here");
  };

  const handleDelete = () => {
    // TODO: Implement flow deletion
    if (confirm("Are you sure you want to delete this flow?")) {
      console.log("Deleting flow:", flowId);
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeftIcon className="size-4" />
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-foreground">
                {flow.name}
              </h1>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <TrashIcon className="mr-2 size-4" />
              Delete
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Execution Form */}
        <Card className="border-border bg-card p-6 shadow-sm">
          <div className="space-y-6">
            {/* Form Header */}
            <div className="flex items-center gap-2">
              <PlayIcon className="size-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Run Flow
              </h2>
            </div>

            {/* Dynamic Input Fields */}
            <div className="space-y-4">
              {flow.inputs.map((input) => (
                <div key={input.id} className="space-y-2">
                  <Label
                    htmlFor={input.id}
                    className="text-sm font-medium text-foreground"
                  >
                    {input.label}
                    {input.required && (
                      <span className="ml-1 text-destructive">*</span>
                    )}
                  </Label>

                  {input.type === "checkbox" ? (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={input.id}
                        checked={Boolean(formData[input.name])}
                        onCheckedChange={(checked) =>
                          handleInputChange(input.name, checked)
                        }
                      />
                      <Label
                        htmlFor={input.id}
                        className="text-sm text-muted-foreground"
                      >
                        Enable this option
                      </Label>
                    </div>
                  ) : (
                    <Input
                      id={input.id}
                      type={input.type}
                      placeholder={input.placeholder}
                      value={(formData[input.name] as string) || ""}
                      onChange={(e) =>
                        handleInputChange(input.name, e.target.value)
                      }
                      className="border-border bg-background"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Run Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleRunFlow}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                size="lg"
              >
                <PlayIcon className="mr-2 size-4" />
                Run Flow
              </Button>
            </div>
          </div>
        </Card>

        {/* Collapsible Details Section */}
        <Card className="overflow-hidden border-border bg-card shadow-xs">
          <button
            onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
            className="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-accent/50"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                What does this flow do?
              </span>
            </div>
            {isDetailsExpanded ? (
              <ChevronDownIcon className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRightIcon className="size-4 text-muted-foreground" />
            )}
          </button>

          {isDetailsExpanded && (
            <div className="border-t border-border px-6 pb-6">
              <div className="prose prose-sm mt-4 max-w-none text-foreground">
                {/* Simple markdown rendering for the explanation */}
                <div
                  dangerouslySetInnerHTML={{
                    __html: flow.explanation
                      .replace(
                        /^# (.*$)/gm,
                        '<h1 class="text-xl font-semibold mb-3">$1</h1>',
                      )
                      .replace(
                        /^## (.*$)/gm,
                        '<h2 class="text-lg font-medium mb-2 mt-4">$1</h2>',
                      )
                      .replace(/^\- (.*$)/gm, '<li class="ml-4">$1</li>')
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\n\n/g, '</p><p class="mb-4">')
                      .replace(/^/, '<p class="mb-4">')
                      .replace(/$/, "</p>"),
                  }}
                />
              </div>
            </div>
          )}

          {!isDetailsExpanded && (
            <div className="px-6 pb-4 text-sm text-muted-foreground">
              Click to see detailed explanation...
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
