import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Database, Loader2, CheckCircle2 } from "lucide-react";

type DatabaseType = "postgresql" | "mysql" | "sqlite" | "unknown";

interface ConnectionFormProps {
  onConnect: (connectionString: string) => void;
  isConnecting: boolean;
  isConnected: boolean;
  databaseType: DatabaseType;
}

interface DatabaseInfo {
  host: string;
  port: number | null;
  databaseName: string;
  username: string;
}

export function ConnectionForm({
  onConnect,
  isConnecting,
  isConnected,
  databaseType,
}: ConnectionFormProps) {
  const [connectionString, setConnectionString] = useState(
    "postgresql://postgres:pgadmin@127.0.0.1:5432/agnodb"
  );

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

  const getDefaultConnectionString = (dbType: DatabaseType): string => {
    switch (dbType) {
      case "postgresql":
        return "postgresql://username:password@localhost:5432/database_name";
      case "mysql":
        return "mysql://username:password@localhost:3306/database_name";
      case "sqlite":
        return "sqlite:///path/to/database.db";
      default:
        return "postgresql://username:password@localhost:5432/database_name";
    }
  };

  const parseConnectionString = (connStr: string): DatabaseInfo | null => {
    try {
      if (connStr.startsWith("sqlite:")) {
        const path = connStr.replace("sqlite://", "").replace("sqlite:", "");
        return {
          host: "localhost",
          port: null,
          databaseName: path || "database",
          username: "N/A",
        };
      }

      // More robust parsing for PostgreSQL and MySQL
      // Format: protocol://username:password@host:port/database
      const regex = /^(\w+):\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
      const match = connStr.match(regex);

      if (!match) {
        console.log("Regex didn't match for:", connStr);
        return null;
      }

      const [, protocol, username, password, host, port, databaseName] = match;

      return {
        host: host || "localhost",
        port: port ? parseInt(port, 10) : null,
        databaseName: databaseName || "unknown",
        username: username || "unknown",
      };
    } catch (error) {
      console.error("Error parsing connection string:", error);
      return null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect(connectionString);
  };

  const dbInfo = isConnected ? parseConnectionString(connectionString) : null;
  console.log(connectionString);
  console.log(dbInfo);

  return (
    <div className="w-full">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="connection-string" className="font-semibold">
              Connection String
            </Label>
            <Input
              id="connection-string"
              type="text"
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              placeholder={getDefaultConnectionString(databaseType)}
              className="font-mono text-sm"
              disabled={isConnecting || isConnected}
            />
          </div>

          {!isConnected && (
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isConnecting || !connectionString.trim()}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  Connect to Database
                </>
              )}
            </Button>
          )}

          {isConnected && dbInfo && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <span className="text-green-700 dark:text-green-300 font-medium">
                    Connected to {getDatabaseDisplayName(databaseType)} database
                  </span>
                  <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                    <div className="grid grid-cols-2 gap-1">
                      <span className="font-medium">Host:</span>
                      <span>{dbInfo.host}</span>

                      <span className="font-medium">Port:</span>
                      <span>{dbInfo.port || "Default"}</span>

                      <span className="font-medium">Database:</span>
                      <span>{dbInfo.databaseName}</span>

                      <span className="font-medium">User:</span>
                      <span>{dbInfo.username}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isConnected && !dbInfo && (
            <div className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
              <span className="text-green-700 dark:text-green-300 font-medium">
                Successfully connected to {getDatabaseDisplayName(databaseType)}{" "}
                database
              </span>
            </div>
          )}
        </form>
      </CardContent>
    </div>
  );
}
