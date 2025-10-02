import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Database, BarChart3 } from "lucide-react";

type DatabaseType = "postgresql" | "mysql" | "sqlite" | "unknown";

interface ResultsTableProps {
  data: any[];
  totalRows?: number;
  databaseType?: DatabaseType;
}

export function ResultsTable({
  data,
  totalRows,
  databaseType = "unknown",
}: ResultsTableProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="w-full shadow-elegant">
        <CardContent className="flex items-center justify-center p-12">
          <div className="text-center text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No results found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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

  const columns = Object.keys(data[0]);

  return (
    <div className="w-full">
      <CardHeader className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div>
              <CardTitle className="text-lg">
                {getDatabaseDisplayName(databaseType)} Query Results
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {data.length} rows
                </Badge>
                {totalRows && totalRows > data.length && (
                  <Badge variant="secondary" className="text-xs">
                    of {totalRows} total
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  {columns.length} columns
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column} className="font-semibold">
                      {column}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index} className="hover:bg-muted/30">
                    {columns.map((column) => (
                      <TableCell key={column} className="font-mono text-sm">
                        {row[column] === null ? (
                          <span className="text-muted-foreground italic">
                            null
                          </span>
                        ) : typeof row[column] === "boolean" ? (
                          <Badge
                            variant={row[column] ? "default" : "secondary"}
                          >
                            {row[column].toString()}
                          </Badge>
                        ) : (
                          String(row[column])
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </div>
  );
}
