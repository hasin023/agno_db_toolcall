import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type DatabaseType = "postgresql" | "mysql" | "sqlite" | "unknown";

interface StatusIndicatorProps {
  status: "connected" | "disconnected" | "connecting" | "error" | "querying";
  message?: string;
  className?: string;
  databaseType?: DatabaseType;
}

export function StatusIndicator({
  status,
  message,
  className,
  databaseType = "unknown",
}: StatusIndicatorProps) {
  const getDatabaseColorClass = (dbType: DatabaseType): string => {
    switch (dbType) {
      case "postgresql":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800";
      case "mysql":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-800";
      case "sqlite":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950/20 dark:text-gray-400 dark:border-gray-800";
    }
  };

  const statusConfig = {
    connected: {
      icon: CheckCircle2,
      text: "Connected",
      variant: "default" as const,
      className: getDatabaseColorClass(databaseType),
    },
    disconnected: {
      icon: XCircle,
      text: "Disconnected",
      variant: "secondary" as const,
      className:
        "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950/20 dark:text-gray-400 dark:border-gray-800",
    },
    connecting: {
      icon: Loader2,
      text: "Connecting",
      variant: "secondary" as const,
      className:
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800",
    },
    error: {
      icon: AlertCircle,
      text: "Error",
      variant: "destructive" as const,
      className:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800",
    },
    querying: {
      icon: Loader2,
      text: "Querying",
      variant: "secondary" as const,
      className:
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      <Icon
        className={cn(
          "h-3 w-3",
          status === "connecting" || status === "querying" ? "animate-spin" : ""
        )}
      />
      {message || config.text}
    </Badge>
  );
}
