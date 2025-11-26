# Execution History Components

This directory contains all the components for implementing comprehensive execution history functionality in the GoopLum frontend, following the style guide and design patterns established in the project.

## Components Overview

### 1. StatusBadge (`badge.tsx`)
- **Purpose**: Display execution status with consistent styling and animations
- **Features**:
  - Color-coded status indicators (pending, running, completed, failed, cancelled)
  - Animated status icons for visual feedback
  - Responsive to status changes with smooth transitions
  - Dark mode support
  - Follows the project's color scheme and typography

### 2. ExecutionHistory (`ExecutionHistory.tsx`)
- **Purpose**: Display a paginated list of executions with filtering
- **Features**:
  - Status filtering (all, running, pending, completed, failed, cancelled)
  - Pagination with navigation controls
  - Real-time refresh capabilities
  - Hover states and micro-interactions
  - Loading and error states
  - Empty state handling
  - Both flow-specific and global execution views

### 3. ExecutionDetails (`ExecutionDetails.tsx`)
- **Purpose**: Modal dialog showing detailed execution information
- **Features**:
  - Complete execution metadata (flow name, duration, timestamps)
  - Display of input parameters and results
  - Stream progress with expandable items
  - Error message display
  - Real-time status polling for running executions
  - Copy functionality for parameters, results, and input data
  - Responsive design with proper scroll handling

### 4. FlowExecutor (`FlowExecutor.tsx`)
- **Purpose**: Enhanced flow execution interface with history integration
- **Features**:
  - Real-time execution status display
  - Recent executions preview
  - Integration with execution history
  - Cancel execution capability
  - Animated status transitions
  - Polling for live updates

## Hooks

### useExecutionPolling (`../../hooks/useExecutionPolling.ts`)
- **Purpose**: Custom hook for real-time execution status polling
- **Features**:
  - Automatic polling with configurable intervals
  - Exponential backoff on errors
  - Completion and error callbacks
  - Cleanup on unmount
  - Retry logic with maximum attempts

## Pages

### Execution Monitor (`/app/executions/page.tsx`)
- **Purpose**: Global dashboard for monitoring all executions
- **Features**:
  - Statistics overview (total, today, running, success rate, etc.)
  - Live execution monitoring
  - Global execution history
  - Responsive grid layout
  - Real-time updates

## Styling and Design

### Following the Style Guide
All components strictly follow the established style guide:

- **Typography**: Geist Mono font family with proper sizing hierarchy
- **Colors**: OKLCH color space with semantic color variables
- **Spacing**: Consistent spacing scale using the 0.25rem base unit
- **Border Radius**: Rounded aesthetic (0.75rem base radius)
- **Shadows**: Subtle layered shadows with low opacity
- **Animations**: Fast, snappy animations (200ms default duration)
- **Dark Mode**: Full theme support with proper color transformations

### Component Patterns
- **Consistent button styling** using shadcn/ui Button variants
- **Card layouts** with proper padding and borders
- **Status indicators** with semantic colors
- **Micro-interactions** with Motion (Framer Motion)
- **Responsive design** with mobile-first approach

## API Integration

### Extended FlowsAPI
The `flowsAPI` service has been extended with execution history endpoints:

```typescript
// Flow-specific execution history
getFlowExecutions(flowId, page, pageSize, status?)

// Global execution history
getAllExecutions(page, pageSize, status?, flowId?)

// Individual execution details
getExecution(executionId)

// Lightweight status polling
getExecutionStatus(executionId)

// Cancel running execution
cancelExecution(executionId)

// Built-in polling with retry logic
pollExecutionStatus(executionId, onStatusChange, onComplete, onError)
```

## Usage Examples

### Basic Execution History
```tsx
import { ExecutionHistory } from "@/components/executions";

<ExecutionHistory
  flowId="your-flow-id"
  onExecutionSelect={(execution) => {
    // Handle execution selection
  }}
/>
```

### Global Execution Monitor
```tsx
import { ExecutionHistory } from "@/components/executions";

<ExecutionHistory
  global={true}
  onExecutionSelect={(execution) => {
    // Handle execution selection
  }}
/>
```

### Execution Details Modal
```tsx
import { ExecutionDetails } from "@/components/executions";

<ExecutionDetails
  execution={selectedExecution}
  isOpen={showDetails}
  onClose={() => setShowDetails(false)}
/>
```

### Real-time Polling Hook
```tsx
import { useExecutionPolling } from "@/hooks/useExecutionPolling";

const { isPolling, currentStatus, execution } = useExecutionPolling({
  executionId: "execution-id",
  onComplete: (execution) => {
    console.log("Execution completed:", execution);
  },
  onError: (error) => {
    console.error("Polling error:", error);
  },
});
```

## Navigation Integration

The execution history feature is integrated into the main navigation:

- **Main Page**: Added "Executions" button in the header
- **Direct Access**: `/executions` route for global monitoring
- **Flow Integration**: Execution history available on flow detail pages

## Performance Considerations

- **Pagination**: Prevents loading large datasets at once
- **Polling**: Lightweight status endpoint for frequent updates
- **Caching**: Component-level state caching for better UX
- **Debouncing**: Filter inputs to prevent excessive API calls
- **Cleanup**: Proper cleanup of intervals and subscriptions

## Error Handling

- **Network Errors**: Graceful degradation with retry options
- **API Errors**: User-friendly error messages
- **Loading States**: Consistent loading indicators
- **Empty States**: Helpful guidance when no data is available

## Accessibility

- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Proper focus handling in modals
- **Color Contrast**: WCAG-compliant color combinations
- **Reduced Motion**: Respects user's motion preferences

## Future Enhancements

Potential improvements to consider:

1. **Real-time WebSocket Updates**: Replace polling with WebSocket connections
2. **Advanced Filtering**: Add date range, flow name, and execution time filters
3. **Export Functionality**: CSV/JSON export of execution data
4. **Charts and Analytics**: Visual representation of execution trends
5. **Bulk Operations**: Cancel multiple executions simultaneously
6. **Scheduled Executions**: View and manage scheduled flow runs
7. **Notification System**: Email/webhook notifications for execution events