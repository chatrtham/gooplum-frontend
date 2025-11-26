"use client";

import React from "react";
import { motion } from "motion/react";
import { Activity, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { ExecutionHistory } from "@/components/executions/ExecutionHistory";
import { ExecutionDetails } from "@/components/executions/ExecutionDetails";
import { flowsAPI, FlowExecution, ExecutionStatus } from "@/lib/flowsApi";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { cn } from "@/lib/utils";

// Mock statistics for the dashboard (in real app, these would come from API)
const mockStats = {
  total: 156,
  today: 23,
  running: 2,
  completed: 142,
  failed: 8,
  cancelled: 4,
  avgDuration: 2.3, // seconds
  successRate: 94.2, // percentage
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: string;
    direction: "up" | "down";
  };
}> = ({ title, value, icon, description, trend }) => {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            {icon}
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">{title}</div>
            <div className="text-2xl font-bold text-foreground">{value}</div>
            {description && (
              <div className="text-xs text-muted-foreground">{description}</div>
            )}
          </div>
        </div>

        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs",
            trend.direction === "up" ? "text-green-600" : "text-red-600"
          )}>
            {trend.direction === "up" ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingUp className="size-3 rotate-180" />
            )}
            {trend.value}
          </div>
        )}
      </div>
    </Card>
  );
};

export default function ExecutionsPage() {
  const [selectedExecution, setSelectedExecution] = React.useState<FlowExecution | null>(null);
  const [showDetails, setShowDetails] = React.useState(false);

  const handleExecutionSelect = (execution: FlowExecution) => {
    setSelectedExecution(execution);
    setShowDetails(true);
  };

  const stats = [
    {
      title: "Total Executions",
      value: mockStats.total,
      icon: <Activity className="size-4 text-blue-500" />,
      description: "All time",
    },
    {
      title: "Today",
      value: mockStats.today,
      icon: <Clock className="size-4 text-green-500" />,
      trend: {
        value: "12%",
        direction: "up" as const,
      },
    },
    {
      title: "Running",
      value: mockStats.running,
      icon: <Clock className="size-4 text-blue-500 animate-pulse" />,
      description: "Currently active",
    },
    {
      title: "Success Rate",
      value: `${mockStats.successRate}%`,
      icon: <CheckCircle className="size-4 text-green-500" />,
      description: `${mockStats.completed} successful`,
    },
    {
      title: "Failed",
      value: mockStats.failed,
      icon: <XCircle className="size-4 text-red-500" />,
      description: "Last 30 days",
    },
    {
      title: "Avg Duration",
      value: `${mockStats.avgDuration}s`,
      icon: <Clock className="size-4 text-purple-500" />,
      description: "Average execution time",
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Execution Monitor</h1>
          <p className="text-muted-foreground mt-1">
            Real-time monitoring of all flow executions across your workspace
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Export Data
          </Button>
          <Button variant="default" size="sm">
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Currently Running Executions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Activity className="size-4" />
              Live Executions
            </h2>
            <StatusBadge status="running" showIcon />
          </div>

          <div className="space-y-2">
            {/* In a real app, this would be populated with actual running executions */}
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="size-8 mx-auto mb-3 opacity-50" />
              <div className="text-sm">No executions currently running</div>
              <div className="text-xs mt-1">Check back later for active executions</div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Global Execution History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Execution History</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
        </div>

        <ExecutionHistory
          global={true}
          onExecutionSelect={handleExecutionSelect}
        />
      </motion.div>

      {/* Execution Details Modal */}
      <ExecutionDetails
        execution={selectedExecution}
        isOpen={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedExecution(null);
        }}
      />
    </div>
  );
}