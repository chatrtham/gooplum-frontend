"use client";

import { useState, useEffect } from "react";
import { Loader2, SaveIcon, PlusIcon, XIcon } from "lucide-react";
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
    system_prompt: string;
    flow_tool_ids: string[];
    gumcp_services: string[];
  }) => Promise<void>;
}

export function AgentConfigPanel({
  initialData,
  isEditing = false,
  onSave,
}: AgentConfigPanelProps) {
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract initial values
  const initialConfig = initialData?.config?.configurable;

  // Form state
  const [name, setName] = useState(initialData?.name || "");
  const [systemPrompt, setSystemPrompt] = useState(
    initialConfig?.system_prompt || "",
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
            flowsAPI.getFlowsList(),
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
      systemPrompt !== (initialConfig?.system_prompt || "");
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

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (!modelPreset) {
      setError("Model preset is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave({
        name,
        model_preset: modelPreset,
        system_prompt: systemPrompt,
        flow_tool_ids: selectedFlowIds,
        gumcp_services: selectedServices,
      });
      setIsDirty(false);
    } catch (err) {
      console.error("Failed to save agent:", err);
      setError(err instanceof Error ? err.message : "Failed to save agent");
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
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col border-l bg-background">
      <div className="border-b p-4">
        <h2 className="font-semibold">Configuration</h2>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* General Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Agent Name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">
              Model <span className="text-destructive">*</span>
            </Label>
            <select
              id="model"
              value={modelPreset}
              onChange={(e) => setModelPreset(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {presets.map((preset) => (
                <option key={preset.name} value={preset.name}>
                  {preset.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {presets.find((p) => p.name === modelPreset)?.description}
            </p>
          </div>
        </div>

        {/* System Prompt */}
        <div className="space-y-2">
          <Label htmlFor="systemPrompt">Instructions</Label>
          <textarea
            id="systemPrompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="You are a helpful assistant..."
            className="flex min-h-[200px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-sm shadow-xs placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          />
        </div>

        {/* Tools Section */}
        <div className="space-y-3">
          <Label>Tools</Label>
          <Card className="space-y-3 p-3">
            <div className="flex flex-wrap gap-2">
              {selectedFlowIds.map((id) => {
                const flow = flows.find((f) => f.id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full border border-transparent bg-secondary px-2.5 py-0.5 pr-1 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
                  >
                    Flow: {flow?.name || id}
                    <button
                      onClick={() => removeFlow(id)}
                      className="ml-1 hover:text-destructive"
                    >
                      <XIcon className="size-3" />
                    </button>
                  </span>
                );
              })}
              {selectedServices.map((service) => (
                <span
                  key={service}
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 pr-1 text-xs font-semibold text-foreground capitalize transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
                >
                  MCP: {service}
                  <button
                    onClick={() => removeService(service)}
                    className="ml-1 hover:text-destructive"
                  >
                    <XIcon className="size-3" />
                  </button>
                </span>
              ))}

              {selectedFlowIds.length === 0 &&
                selectedServices.length === 0 && (
                  <span className="text-sm text-muted-foreground">
                    No tools selected
                  </span>
                )}
            </div>

            <div className="flex gap-2 pt-2">
              <Dialog
                open={isFlowDialogOpen}
                onOpenChange={setIsFlowDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    <PlusIcon className="mr-1 size-3" />
                    Add Flows
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Select Flow Tools</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[300px] space-y-2 overflow-y-auto py-4">
                    {flows.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No flows available.
                      </p>
                    ) : (
                      flows.map((flow) => (
                        <div
                          key={flow.id}
                          className="flex items-start space-x-2 rounded p-2 hover:bg-accent"
                        >
                          <Checkbox
                            id={`flow-select-${flow.id}`}
                            checked={selectedFlowIds.includes(flow.id)}
                            onCheckedChange={() => toggleFlow(flow.id)}
                          />
                          <div className="grid gap-1">
                            <label
                              htmlFor={`flow-select-${flow.id}`}
                              className="cursor-pointer text-sm font-medium"
                            >
                              {flow.name}
                            </label>
                            <p className="text-xs text-muted-foreground">
                              {flow.description}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setIsFlowDialogOpen(false)}>
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
                    className="flex-1 text-xs"
                  >
                    <PlusIcon className="mr-1 size-3" />
                    Add guMCP
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Select guMCP Services</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[300px] space-y-2 overflow-y-auto py-4">
                    {services.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No services available.
                      </p>
                    ) : (
                      services.map((service) => (
                        <div
                          key={service}
                          className="flex items-center space-x-2 rounded p-2 hover:bg-accent"
                        >
                          <Checkbox
                            id={`service-select-${service}`}
                            checked={selectedServices.includes(service)}
                            onCheckedChange={() => toggleService(service)}
                          />
                          <label
                            htmlFor={`service-select-${service}`}
                            className="flex-1 cursor-pointer text-sm font-medium capitalize"
                          >
                            {service}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setIsServiceDialogOpen(false)}>
                      Done
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        </div>
      </div>

      <div className="border-t p-4">
        <Button
          onClick={handleSave}
          disabled={loading || !isDirty}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <SaveIcon className="mr-2 size-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
