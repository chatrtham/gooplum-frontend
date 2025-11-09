"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FlowSchema,
  FlowParameters as FlowParametersType,
  ParameterSchema,
} from "@/lib/flowsApi";
import { Loader2 } from "lucide-react";

interface FlowParametersProps {
  schema: FlowSchema;
  onSubmit: (params: FlowParametersType) => void;
  isLoading: boolean;
}

export function FlowParameters({
  schema,
  onSubmit,
  isLoading,
}: FlowParametersProps) {
  const [params, setParams] = useState<FlowParametersType>({});

  const renderInput = (key: string, param: ParameterSchema) => {
    // Determine if parameter is required
    const isRequired = param.required || false;

    // Different input types based on parameter schema
    switch (param.type) {
      case "string":
        if (param.enum) {
          return (
            <Select
              value={typeof params[key] === "string" ? params[key] : ""}
              onValueChange={(value) => setParams({ ...params, [key]: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${key}`} />
              </SelectTrigger>
              <SelectContent>
                {param.enum.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }
        return (
          <Input
            type="text"
            value={typeof params[key] === "string" ? params[key] : ""}
            onChange={(e) => setParams({ ...params, [key]: e.target.value })}
            placeholder={param.description || `Enter ${key}`}
            required={isRequired}
          />
        );

      case "number":
      case "integer":
        return (
          <Input
            type="number"
            value={typeof params[key] === "number" ? params[key] : ""}
            onChange={(e) =>
              setParams({ ...params, [key]: Number(e.target.value) })
            }
            placeholder={param.description || `Enter ${key}`}
            required={isRequired}
            step={param.type === "integer" ? "1" : "0.01"}
          />
        );

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={key}
              checked={typeof params[key] === "boolean" ? params[key] : false}
              onCheckedChange={(checked) =>
                setParams({ ...params, [key]: checked })
              }
            />
            <Label htmlFor={key} className="text-sm font-normal">
              {param.description || key}
            </Label>
          </div>
        );

      case "array":
        return (
          <Textarea
            value={Array.isArray(params[key]) ? params[key].join("\n") : ""}
            onChange={(e) => {
              const lines = e.target.value
                .split("\n")
                .filter((line) => line.trim());
              setParams({ ...params, [key]: lines });
            }}
            placeholder={
              param.description || `Enter ${key} (one item per line)`
            }
            rows={3}
          />
        );

      case "object":
        return (
          <Textarea
            value={
              typeof params[key] === "object" && params[key] !== null
                ? JSON.stringify(params[key], null, 2)
                : ""
            }
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setParams({ ...params, [key]: parsed });
              } catch {
                setParams({ ...params, [key]: e.target.value });
              }
            }}
            placeholder={param.description || `Enter ${key} as JSON`}
            rows={4}
            className="font-mono text-sm"
          />
        );

      default:
        return (
          <Textarea
            value={typeof params[key] === "string" ? params[key] : ""}
            onChange={(e) => setParams({ ...params, [key]: e.target.value })}
            placeholder={param.description || `Enter ${key}`}
            rows={3}
          />
        );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(params);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {Object.entries(schema.parameters).map(([key, param]) => (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="flex items-center gap-1">
            {key}
            {param.required && <span className="text-red-500">*</span>}
          </Label>
          {renderInput(key, param)}
          {param.description && param.type !== "boolean" && (
            <p className="text-xs text-muted-foreground">{param.description}</p>
          )}
        </div>
      ))}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Executing...
          </>
        ) : (
          "Execute Flow"
        )}
      </Button>
    </form>
  );
}
