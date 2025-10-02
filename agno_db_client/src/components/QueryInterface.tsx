import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, Send, Code2 } from "lucide-react";

type DatabaseType = "postgresql" | "mysql" | "sqlite" | "unknown";

interface QueryInterfaceProps {
  onQuery: (query: string) => void;
  isQuerying: boolean;
  databaseType?: DatabaseType;
}

export function QueryInterface({
  onQuery,
  isQuerying,
  databaseType = "unknown",
}: QueryInterfaceProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onQuery(query);
    }
  };

  const getDatabaseDisplayName = (dbType: DatabaseType): string => {
    switch (dbType) {
      case "postgresql":
        return "PostgreSQL";
      case "mysql":
        return "MySQL";
      case "sqlite":
        return "SQLite";
      default:
        return "Database";
    }
  };

  const getDatabaseColorClass = (dbType: DatabaseType): string => {
    switch (dbType) {
      case "postgresql":
        return "bg-blue-100 text-blue-800";
      case "mysql":
        return "bg-orange-100 text-orange-800";
      case "sqlite":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const exampleQueries = [
    `What is the monthly revenue trend over the last 12 months?`,
    `Show me all users who signed up in the last 30 days`,
    `Find the top 10 products by sales revenue`,
    `List all orders with status 'pending' and amount over $100`,
    `Get the average order value by month for this year`,
  ];

  return (
    <div className="w-full">
      <CardHeader className="p-0">
        <div className="flex items-center gap-3">
          <div>
            <CardTitle className="text-xl">Natural Language Query</CardTitle>
            <CardDescription className="mb-4">
              Ask questions about your {getDatabaseDisplayName(databaseType)}{" "}
              data in plain English
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Ask a question about your ${getDatabaseDisplayName(
                databaseType
              )} data...`}
              className="min-h-24 resize-none"
              disabled={isQuerying}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isQuerying || !query.trim()}
          >
            {isQuerying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing Query...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Execute Query
              </>
            )}
          </Button>
        </form>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Example queries:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((example, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-blue-100 hover:text-blue-800 transition-colors"
                onClick={() => setQuery(example)}
              >
                {example}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </div>
  );
}
