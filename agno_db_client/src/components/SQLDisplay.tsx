import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";

type DatabaseType = "postgresql" | "mysql" | "sqlite" | "unknown";

interface SQLDisplayProps {
  sql: string;
  executionTime?: number;
  databaseType?: DatabaseType;
}

export function SQLDisplay({
  sql,
  executionTime,
  databaseType = "unknown",
}: SQLDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        return "SQL";
    }
  };

  const getDatabaseColor = (dbType: DatabaseType): string => {
    switch (dbType) {
      case "postgresql":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "mysql":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "sqlite":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatSQL = (sql: string) => {
    // Escape HTML characters first
    let escapedSql = sql
      .replace(/&/g, "&amp;")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, "&quot;");

    // Comments (single line and multi-line)
    escapedSql = escapedSql.replace(
      /(\/\*[\s\S]*?\*\/|--.*$)/gm,
      '<span class="sql-comment text-gray-500 dark:text-gray-400">$1</span>'
    );

    // Strings (handle escaped quotes properly)
    escapedSql = escapedSql.replace(
      /('(?:[^'\\]|\\.)*')/g,
      '<span class="sql-string text-green-600 dark:text-green-400">$1</span>'
    );

    // Common SQL keywords (simple approach to avoid conflicts)
    escapedSql = escapedSql.replace(
      /\b(SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|OUTER|ON|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|AND|OR|NOT|IN|IS|NULL|AS|DISTINCT|UNION|ALL|EXISTS|BETWEEN|LIKE)\b/gi,
      '<span class="sql-keyword font-bold text-blue-600 dark:text-blue-400">$1</span>'
    );

    return escapedSql;
  };

  return (
    <div className="w-full">
      <CardHeader className="p-0 mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="text-lg font-semibold">
                Executed SQL
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  className={`${getDatabaseColor(databaseType)} font-medium`}
                >
                  {getDatabaseDisplayName(databaseType)}
                </Badge>
                {executionTime !== undefined && (
                  <Badge variant="secondary" className="text-xs font-medium">
                    {executionTime}ms
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-9 px-3"
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy SQL
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          <pre className="p-4 bg-gray-50 border border-1 border-gray-200 dark:bg-gray-900 text-sm leading-relaxed font-mono overflow-x-auto max-h-96 overflow-y-auto">
            <code
              className="whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: formatSQL(sql) }}
            />
          </pre>
        </div>
      </CardContent>
    </div>
  );
}
