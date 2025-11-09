import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  flowsApi,
  FlowInfo,
  FlowSchema,
  ExecutionResponse,
  StreamMessage,
} from "@/lib/flowsApi";

// Hook to fetch all flows
export const useFlows = () => {
  return useQuery({
    queryKey: ["flows"],
    queryFn: flowsApi.getFlows,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
  });
};

// Hook to fetch specific flow schema
export const useFlowSchema = (flowName: string) => {
  return useQuery({
    queryKey: ["flow", flowName, "schema"],
    queryFn: () => flowsApi.getFlowSchema(flowName),
    enabled: !!flowName,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 3,
  });
};

// Hook to execute a flow
export const useExecuteFlow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      flowName,
      parameters,
    }: {
      flowName: string;
      parameters: Record<string, any>;
    }) => flowsApi.executeFlow(flowName, parameters),
    onSuccess: () => {
      // Invalidate flows query to refresh any potential changes
      queryClient.invalidateQueries({ queryKey: ["flows"] });
    },
    onError: (error) => {
      console.error("Flow execution failed:", error);
    },
  });
};

// Hook to delete a flow
export const useDeleteFlow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: flowsApi.deleteFlow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flows"] });
    },
    onError: (error) => {
      console.error("Flow deletion failed:", error);
    },
  });
};

// Hook for streaming flow execution
export const useExecuteFlowStream = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      flowName,
      parameters,
      onMessage,
      onError,
    }: {
      flowName: string;
      parameters: Record<string, any>;
      onMessage: (message: StreamMessage) => void;
      onError?: (error: Error) => void;
    }) => {
      await flowsApi.executeFlowStream(
        flowName,
        parameters,
        onMessage,
        onError,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flows"] });
    },
    onError: (error) => {
      console.error("Flow streaming execution failed:", error);
    },
  });
};

// Hook to search flows (client-side filtering)
export const useSearchFlows = (
  flows: FlowInfo[] | undefined,
  searchTerm: string,
) => {
  return useQuery({
    queryKey: ["flows", "search", searchTerm],
    queryFn: () => {
      if (!flows) return [];

      if (!searchTerm.trim()) return flows;

      const term = searchTerm.toLowerCase();
      return flows.filter(
        (flow) =>
          flow.name.toLowerCase().includes(term) ||
          flow.description.toLowerCase().includes(term),
      );
    },
    enabled: !!flows,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
