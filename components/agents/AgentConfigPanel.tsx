"use client";

import { useState, useEffect, useRef } from "react";
import {
  RefreshCwIcon,
  SaveIcon,
  PlusIcon,
  XIcon,
  WrenchIcon,
  BotIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getModelPresets, getGumcpServices } from "@/lib/agentsApi";
import { flowsAPI } from "@/lib/flowsApi";
import type { Assistant, ModelPreset } from "@/types/agents";
import type { Flow } from "@/lib/flowsApi";

interface AgentConfigPanelProps {
  initialData?: Assistant;
  isEditing?: boolean;
  onSave: (data: {
    name: string;
    model_preset: string;
    instructions: string;
    flow_tool_ids: string[];
    gumcp_services: string[];
  }) => Promise<void>;
  variant?: "sidebar" | "full-page";
}

export function AgentConfigPanel({
  initialData,
  isEditing = false,
  onSave,
  variant = "sidebar",
}: AgentConfigPanelProps) {
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract initial values
  const initialConfig = initialData?.config?.configurable;

  // Form state
  const [name, setName] = useState(initialData?.name || "");
  const [systemPrompt, setSystemPrompt] = useState(
    initialConfig?.instructions || "",
  );
  const [modelPreset, setModelPreset] = useState(
    initialConfig?.model_preset || "",
  );
  const [selectedFlowIds, setSelectedFlowIds] = useState<string[]>(
    initialConfig?.flow_tool_ids || [],
  );
  const [selectedServices, setSelectedServices] = useState<string[]>(
    initialConfig?.gumcp_services || [],
  );

  // Available options
  const [presets, setPresets] = useState<ModelPreset[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [services, setServices] = useState<string[]>([]);

  // Dialog states
  const [isFlowDialogOpen, setIsFlowDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);

  // Dirty state tracking
  const [isDirty, setIsDirty] = useState(false);

  // Fetch available options
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedPresets, fetchedFlows, fetchedServices] =
          await Promise.all([
            getModelPresets(),
            flowsAPI.getFlowsList(0, 1000), // Fetch up to 1000 flows for tool selection
            getGumcpServices(),
          ]);

        setPresets(fetchedPresets);
        setFlows(fetchedFlows);
        setServices(fetchedServices);

        // Set default model preset if creating new and none selected
        if (!isEditing && !modelPreset && fetchedPresets.length > 0) {
          setModelPreset(fetchedPresets[0].name);
        }
      } catch (err) {
        console.error("Failed to load form data:", err);
        setError("Failed to load available options.");
      } finally {
        setInitializing(false);
      }
    };

    fetchData();
  }, [isEditing, modelPreset]);

  // Check for dirty state
  useEffect(() => {
    if (initializing) return;

    const isNameChanged = name !== (initialData?.name || "");
    const isPromptChanged =
      systemPrompt !== (initialConfig?.instructions || "");
    const isModelChanged = modelPreset !== (initialConfig?.model_preset || "");

    // Simple array comparison (assuming order doesn't matter but for simplicity checking length and inclusion)
    const initialFlows = initialConfig?.flow_tool_ids || [];
    const isFlowsChanged =
      selectedFlowIds.length !== initialFlows.length ||
      !selectedFlowIds.every((id) => initialFlows.includes(id));

    const initialServices = initialConfig?.gumcp_services || [];
    const isServicesChanged =
      selectedServices.length !== initialServices.length ||
      !selectedServices.every((s) => initialServices.includes(s));

    setIsDirty(
      isNameChanged ||
        isPromptChanged ||
        isModelChanged ||
        isFlowsChanged ||
        isServicesChanged,
    );
  }, [
    name,
    systemPrompt,
    modelPreset,
    selectedFlowIds,
    selectedServices,
    initialData,
    initialConfig,
    initializing,
  ]);

  const topRef = useRef<HTMLDivElement>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Name is required");
      topRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (!modelPreset) {
      setError("Model preset is required");
      topRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave({
        name,
        model_preset: modelPreset,
        instructions: systemPrompt,
        flow_tool_ids: selectedFlowIds,
        gumcp_services: selectedServices,
      });
      setIsDirty(false);
    } catch (err) {
      console.error("Failed to save agent:", err);
      setError(err instanceof Error ? err.message : "Failed to save agent");
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  const toggleFlow = (flowId: string) => {
    setSelectedFlowIds((prev) =>
      prev.includes(flowId)
        ? prev.filter((id) => id !== flowId)
        : [...prev, flowId],
    );
  };

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service],
    );
  };

  const removeFlow = (flowId: string) => {
    setSelectedFlowIds((prev) => prev.filter((id) => id !== flowId));
  };

  const removeService = (service: string) => {
    setSelectedServices((prev) => prev.filter((s) => s !== service));
  };

  if (initializing) {
    return (
      <div className="flex h-full items-center justify-center">
        <RefreshCwIcon className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (variant === "full-page") {
    return (
      <div
        ref={topRef}
        className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-8 duration-300"
      >
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Create New Agent
          </h2>
          <p className="text-muted-foreground">
            Configure your agent's personality and capabilities.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Research Assistant"
                required
                className={`h-10 rounded-lg border-input bg-background px-3 shadow-sm transition-all focus-visible:ring-primary/20 ${
                  error?.includes("Name")
                    ? "border-destructive focus-visible:ring-destructive/20"
                    : ""
                }`}
              />
              {error?.includes("Name") ? (
                <p className="text-xs font-medium text-destructive">{error}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Give your agent a name.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model" className="text-sm font-medium">
                AI Model <span className="text-destructive">*</span>
              </Label>
              <Select value={modelPreset} onValueChange={setModelPreset}>
                <SelectTrigger
                  id="model"
                  className="h-10 w-full rounded-lg border-input bg-background px-3 shadow-sm transition-all focus:ring-primary/20"
                >
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((preset) => (
                    <SelectItem key={preset.name} value={preset.name}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {presets.find((p) => p.name === modelPreset)?.description ||
                  "Select the AI model that powers your agent."}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemPrompt" className="text-sm font-medium">
              Instructions
            </Label>
            <textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are a helpful assistant..."
              className="flex min-h-[200px] w-full resize-y rounded-lg border border-input bg-transparent px-4 py-3 font-mono text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:outline-none"
            />
            <p className="text-xs text-muted-foreground">
              Define how your agent should behave and what it should do.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Tools</Label>
              <span className="text-xs text-muted-foreground">
                Select tools to give your agent powers
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="flex flex-col gap-0 overflow-hidden border-border/60 bg-card/50 p-0 backdrop-blur-sm transition-all hover:border-border/80">
                <div className="border-b border-border/60 bg-muted/50 px-4 py-3">
                  <h4 className="flex items-center gap-2 text-sm font-medium">
                    <WrenchIcon className="size-4 text-primary" />
                    Flows
                  </h4>
                </div>
                <div className="max-h-[300px] flex-1 overflow-y-auto p-2">
                  {flows.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No flows available.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {flows.map((flow) => (
                        <div
                          key={flow.id}
                          className={`group flex cursor-pointer items-start space-x-3 rounded-lg border p-3 transition-all duration-150 ease-out ${
                            selectedFlowIds.includes(flow.id)
                              ? "border-primary/20 bg-primary/5"
                              : "border-transparent hover:bg-muted/50"
                          }`}
                          onClick={() => toggleFlow(flow.id)}
                        >
                          <Checkbox
                            checked={selectedFlowIds.includes(flow.id)}
                            className="pointer-events-none mt-1"
                          />
                          <div className="grid gap-0.5">
                            <span className="text-sm leading-none font-medium">
                              {flow.name}
                            </span>
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              {flow.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              <Card className="flex flex-col gap-0 overflow-hidden border-border/60 bg-card/50 p-0 backdrop-blur-sm transition-all hover:border-border/80">
                <div className="border-b border-border/60 bg-muted/50 px-4 py-3">
                  <h4 className="flex items-center gap-2 text-sm font-medium">
                    <BotIcon className="size-4 text-secondary" />
                    Integrations (guMCP)
                  </h4>
                </div>
                <div className="max-h-[300px] flex-1 overflow-y-auto p-2">
                  {services.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No services available.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {services.map((service) => (
                        <div
                          key={service}
                          className={`group flex cursor-pointer items-center space-x-3 rounded-lg border p-3 transition-all duration-150 ease-out ${
                            selectedServices.includes(service)
                              ? "border-secondary/20 bg-secondary/5"
                              : "border-transparent hover:bg-muted/50"
                          }`}
                          onClick={() => toggleService(service)}
                        >
                          <Checkbox
                            checked={selectedServices.includes(service)}
                            className="pointer-events-none data-[state=checked]:border-secondary data-[state=checked]:bg-secondary"
                          />
                          <span className="flex-1 text-sm leading-none font-medium capitalize">
                            {service}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-4 pt-4">
          {error && (
            <p className="animate-in fade-in slide-in-from-bottom-2 text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          <Button
            onClick={handleSave}
            disabled={loading || !isDirty}
            className="h-11 min-w-[140px] text-base font-medium shadow-sm"
            size="lg"
          >
            {loading ? (
              <>
                <RefreshCwIcon className="mr-2 size-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <SaveIcon className="mr-2 size-5" />
                Create Agent
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-card" ref={topRef}>
      <div className="p-6 pb-4">
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto p-6">
        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* General Info */}
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Research Assistant"
              required
              className={`h-10 rounded-lg border-input bg-background px-3 shadow-sm transition-all focus-visible:ring-primary/20 ${
                error?.includes("Name")
                  ? "border-destructive focus-visible:ring-destructive/20"
                  : ""
              }`}
            />
            {error?.includes("Name") && (
              <p className="text-xs font-medium text-destructive">{error}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="model" className="text-sm font-medium">
              AI Model <span className="text-destructive">*</span>
            </Label>
            <Select value={modelPreset} onValueChange={setModelPreset}>
              <SelectTrigger
                id="model"
                className="h-10 w-full rounded-lg border-input bg-background px-3 shadow-sm transition-all focus:ring-primary/20"
              >
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {presets.map((preset) => (
                  <SelectItem key={preset.name} value={preset.name}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {presets.find((p) => p.name === modelPreset)?.description}
            </p>
          </div>
        </div>

        {/* System Prompt */}
        <div className="space-y-2">
          <Label htmlFor="systemPrompt" className="text-sm font-medium">
            Instructions
          </Label>
          <textarea
            id="systemPrompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="You are a helpful assistant..."
            className="flex min-h-[200px] w-full resize-y rounded-lg border border-input bg-transparent px-4 py-3 font-mono text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:outline-none"
          />
        </div>

        {/* Tools Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Tools</Label>
          <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex min-h-[2rem] flex-wrap gap-2">
              {selectedFlowIds.map((id) => {
                const flow = flows.find((f) => f.id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary shadow-sm dark:border-primary/20 dark:bg-primary/10 dark:text-primary"
                  >
                    Flow: {flow?.name || id}
                    <button
                      onClick={() => removeFlow(id)}
                      className="ml-1 cursor-pointer rounded-full p-0.5 hover:bg-primary/20 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary"
                    >
                      <XIcon className="size-3" />
                    </button>
                  </span>
                );
              })}
              {selectedServices.map((service) => (
                <span
                  key={service}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-secondary/20 bg-secondary/10 px-2.5 py-1 text-xs font-medium text-secondary capitalize shadow-sm dark:border-secondary/20 dark:bg-secondary/10 dark:text-secondary"
                >
                  Integration: {service}
                  <button
                    onClick={() => removeService(service)}
                    className="ml-1 cursor-pointer rounded-full p-0.5 hover:bg-secondary/20 hover:text-secondary dark:hover:bg-secondary/20 dark:hover:text-secondary"
                  >
                    <XIcon className="size-3" />
                  </button>
                </span>
              ))}

              {selectedFlowIds.length === 0 &&
                selectedServices.length === 0 && (
                  <span className="text-sm text-muted-foreground italic">
                    No tools selected.
                  </span>
                )}
            </div>

            <div className="flex gap-3 pt-2">
              <Dialog
                open={isFlowDialogOpen}
                onOpenChange={setIsFlowDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 flex-1 text-xs font-medium shadow-sm"
                  >
                    <PlusIcon className="mr-1.5 size-3.5" />
                    Add Flows
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-medium tracking-tight">
                      Select Flow Tools
                    </DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[300px] space-y-2 overflow-y-auto py-4 pr-2">
                    {flows.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No flows available. Create a flow first.
                      </p>
                    ) : (
                      flows.map((flow) => (
                        <div
                          key={flow.id}
                          className="group flex cursor-pointer items-start space-x-3 rounded-lg border border-transparent p-3 transition-all duration-150 ease-out hover:border-border/60 hover:bg-muted/50"
                          onClick={() => toggleFlow(flow.id)}
                        >
                          <Checkbox
                            checked={selectedFlowIds.includes(flow.id)}
                            className="pointer-events-none mt-1 rounded-sm border-border/60 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                          />
                          <div className="grid gap-1">
                            <span className="text-sm leading-none font-medium tracking-tight text-foreground/90">
                              {flow.name}
                            </span>
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              {flow.description}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => setIsFlowDialogOpen(false)}
                      className="h-9 font-medium"
                    >
                      Done
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog
                open={isServiceDialogOpen}
                onOpenChange={setIsServiceDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 flex-1 text-xs font-medium shadow-sm"
                  >
                    <PlusIcon className="mr-1.5 size-3.5" />
                    Add guMCP
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-medium tracking-tight">
                      Select guMCP Services
                    </DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[300px] space-y-2 overflow-y-auto py-4 pr-2">
                    {services.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No services available.
                      </p>
                    ) : (
                      services.map((service) => (
                        <div
                          key={service}
                          className="group flex cursor-pointer items-center space-x-3 rounded-lg border border-transparent p-3 transition-all duration-150 ease-out hover:border-border/60 hover:bg-muted/50"
                          onClick={() => toggleService(service)}
                        >
                          <Checkbox
                            checked={selectedServices.includes(service)}
                            className="pointer-events-none rounded-sm border-border/60 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                          />
                          <span className="flex-1 text-sm leading-none font-medium tracking-tight text-foreground/90 capitalize">
                            {service}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => setIsServiceDialogOpen(false)}
                      className="h-9 font-medium"
                    >
                      Done
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-muted/20 p-6 pt-4">
        <Button
          onClick={handleSave}
          disabled={loading || !isDirty}
          className="h-11 w-full text-base font-medium shadow-sm"
          size="lg"
        >
          {loading ? (
            <>
              <RefreshCwIcon className="mr-2 size-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <SaveIcon className="mr-2 size-5" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
