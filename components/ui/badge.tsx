import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import { ExecutionStatus } from "@/lib/flowsApi";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
  {
    variants: {
      status: {
        pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
        running: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 animate-pulse",
        completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
      },
    },
    defaultVariants: {
      status: "pending",
    },
  },
);

interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  status?: ExecutionStatus;
  showIcon?: boolean;
  animateOnStatusChange?: boolean;
}

// Status Icons
const StatusIcon = ({ status }: { status: ExecutionStatus }) => {
  switch (status) {
    case "pending":
      return (
        <svg
          className="size-3"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="8"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeDasharray="16 8"
            className="animate-spin"
          />
        </svg>
      );
    case "running":
      return (
        <svg
          className="size-3 animate-pulse"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M13 2.05v2.02c3.95.49 7 3.85 7 7.93s-3.05 7.44-7 7.93v2.02c5.05-.5 9-4.76 9-9.95s-3.95-9.45-9-9.95z" />
          <path d="M12 7v5l4.25 2.52.77-1.28-3.52-2.09V7H12z" />
        </svg>
      );
    case "completed":
      return (
        <svg
          className="size-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polyline points="20,6 9,17 4,12" />
        </svg>
      );
    case "failed":
      return (
        <svg
          className="size-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    case "cancelled":
      return (
        <svg
          className="size-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    default:
      return null;
  }
};

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status = "pending", showIcon = true, animateOnStatusChange = true, children, ...props }, ref) => {
    const [previousStatus, setPreviousStatus] = React.useState<ExecutionStatus>(status);
    const [shouldAnimate, setShouldAnimate] = React.useState(false);

    React.useEffect(() => {
      if (animateOnStatusChange && status !== previousStatus) {
        setShouldAnimate(true);
        setPreviousStatus(status);

        // Reset animation state after animation completes
        const timer = setTimeout(() => setShouldAnimate(false), 300);
        return () => clearTimeout(timer);
      }
    }, [status, previousStatus, animateOnStatusChange]);

    const motionProps = shouldAnimate && animateOnStatusChange
      ? {
          initial: { scale: 1.2, opacity: 0.8 },
          animate: { scale: 1, opacity: 1 },
          transition: {
            type: "spring" as const,
            stiffness: 400,
            damping: 20,
            duration: 0.2,
          },
          // Filter out conflicting drag props
          onDrag: undefined,
          onDragStart: undefined,
          onDragEnd: undefined,
          onAnimationStart: undefined,
        }
      : {
          onDrag: undefined,
          onDragStart: undefined,
          onDragEnd: undefined,
          onAnimationStart: undefined,
        };

    // Filter out props that conflict with motion
    const { onDrag, onDragStart, onDragEnd, onAnimationStart, ...safeProps } = props;

    return (
      <motion.span
        ref={ref}
        className={cn(statusBadgeVariants({ status, className }))}
        {...motionProps}
        {...safeProps}
      >
        {showIcon && <StatusIcon status={status} />}
        {children || status.charAt(0).toUpperCase() + status.slice(1)}
      </motion.span>
    );
  }
);

StatusBadge.displayName = "StatusBadge";

export { StatusBadge, statusBadgeVariants };