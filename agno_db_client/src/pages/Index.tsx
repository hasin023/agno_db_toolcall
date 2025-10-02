import { useState } from "react";
import { ConnectionForm } from "@/components/ConnectionForm";
import { QueryInterface } from "@/components/QueryInterface";
import { SQLDisplay } from "@/components/SQLDisplay";
import { ResultsTable } from "@/components/ResultsTable";
import { useToast } from "@/hooks/use-toast";
import { Database, Wifi, WifiOff, Loader2 } from "lucide-react";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";
type QueryStatus = "idle" | "querying" | "success" | "error";
type DatabaseType = "postgresql" | "mysql" | "sqlite" | "unknown";

interface QueryResult {
  sql: string;
  data: any[];
  executionTime: number;
  databaseType: DatabaseType;
}

interface ToolCall {
  name: string;
  arguments: any;
  result?: string;
  sql?: string;
}

interface ConversationStep {
  type: "user" | "agent" | "result";
  content: string;
  toolName?: string;
  toolCalls?: ToolCall[];
}

const Index = () => {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [queryStatus, setQueryStatus] = useState<QueryStatus>("idle");
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [databaseType, setDatabaseType] = useState<DatabaseType>("unknown");
  const [conversation, setConversation] = useState<ConversationStep[]>([]);
  const { toast } = useToast();

  const API_BASE_URL = "http://localhost:8000/api";

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

  const handleConnect = async (connectionString: string) => {
    setConnectionStatus("connecting");
    setConversation([{ type: "agent", content: "Connecting to database..." }]);

    try {
      const response = await fetch(`${API_BASE_URL}/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conn_str: connectionString }),
      });

      const data = await response.json();

      if (response.ok) {
        setSessionId(data.session_id);
        setDatabaseType(data.database_type || "unknown");
        setConnectionStatus("connected");
        setConversation((prev) => [
          ...prev,
          { type: "result", content: "Database connected successfully" },
        ]);
        toast({
          title: "Database Connected",
          description: `Successfully connected to ${getDatabaseDisplayName(
            data.database_type || "unknown"
          )} database`,
        });
      } else {
        throw new Error(data.detail || "Connection failed");
      }
    } catch (error: any) {
      setConnectionStatus("error");
      setConversation((prev) => [
        ...prev,
        { type: "result", content: `Connection failed: ${error.message}` },
      ]);
      toast({
        title: "Connection Failed",
        description:
          error.message || "Please check your connection string and try again",
        variant: "destructive",
      });
    }
  };

  const handleQuery = async (query: string) => {
    if (!sessionId) {
      toast({
        title: "Not Connected",
        description: "Please connect to a database first",
        variant: "destructive",
      });
      return;
    }

    setQueryStatus("querying");
    const newConversation: ConversationStep[] = [
      { type: "user", content: query },
      {
        type: "agent",
        content: "Processing query with AI Agent...",
        toolName: "AI Agent",
      },
    ];
    setConversation(newConversation);

    try {
      const response = await fetch(`${API_BASE_URL}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          prompt: query,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const updatedConversation = [...newConversation];

        if (data.tool_calls && data.tool_calls.length > 0) {
          const toolNames = data.tool_calls.map(
            (toolCall: ToolCall) => toolCall.name
          );
          updatedConversation.push({
            type: "agent",
            content: `Tool Calls by Agent - ${toolNames.join(", ")}`,
            toolName: "AI Agent",
          });
        }

        updatedConversation.push({
          type: "result",
          content: data.response || "Query executed successfully",
        });

        setConversation(updatedConversation);

        let parsedData: any[] = [];

        try {
          if (typeof data.response === "string") {
            parsedData = parseAIResponse(data.response);
          } else if (Array.isArray(data.response)) {
            parsedData = data.response;
          } else if (
            typeof data.response === "object" &&
            data.response !== null
          ) {
            parsedData = [data.response];
          }
        } catch (parseError) {
          console.warn("Could not parse response as JSON, using raw content");
          parsedData = [
            {
              result: data.response || "Query executed successfully",
              sql: data.sql || "No SQL available",
            },
          ];
        }

        const result: QueryResult = {
          sql: data.sql || "",
          data: parsedData,
          executionTime: data.execution_time || 0,
          databaseType: data.database_type || databaseType,
        };

        setQueryResult(result);
        setQueryStatus("success");
      } else {
        setConversation((prev) => [
          ...prev,
          {
            type: "result",
            content: `Query failed: ${data.detail || "Unknown error"}`,
          },
        ]);
        throw new Error(data.detail || "Query execution failed");
      }
    } catch (error: any) {
      setQueryStatus("error");
      toast({
        title: "Query Failed",
        description:
          error.message || "An error occurred while executing the query",
        variant: "destructive",
      });
    }
  };

  const parseAIResponse = (response: string): any[] => {
    console.log("Parsing Agent Response:", response);

    if (response.includes("|") && response.includes("-|-")) {
      return parseMarkdownTable(response);
    }

    try {
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]);
      }
    } catch (e) {
      console.warn("Could not parse JSON from response");
    }

    return [
      {
        content: response,
        type: "text_response",
      },
    ];
  };

  const parseMarkdownTable = (markdown: string): any[] => {
    const lines = markdown.split("\n").filter((line) => line.trim() !== "");
    if (lines.length < 3) return [];

    const separatorIndex = lines.findIndex(
      (line) => line.includes("|") && line.includes("-|-")
    );
    if (separatorIndex === -1) return [];

    const headers = lines[separatorIndex - 1]
      .split("|")
      .map((h) => h.trim())
      .filter((h) => h.length > 0);

    const dataRows = lines.slice(separatorIndex + 1);
    const result = dataRows.map((row) => {
      const values = row
        .split("|")
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || "";
      });
      return obj;
    });

    return result;
  };

  const handleDisconnect = () => {
    setConnectionStatus("disconnected");
    setSessionId(null);
    setDatabaseType("unknown");
    setQueryResult(null);
    setConversation([]);
    toast({
      title: "Disconnected",
      description: "Database connection closed",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-lg lg:text-xl font-bold text-gray-900">
              Database Natural Query
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {connectionStatus === "connected" && (
              <button
                onClick={handleDisconnect}
                className="text-sm text-gray-500 flex items-center border border-gray-300 hover:border-rose-400 hover:text-rose-600 px-3 py-1 rounded-lg transition"
              >
                Disconnect
              </button>
            )}
            <div className="flex items-center space-x-2">
              {connectionStatus === "connecting" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm text-gray-500">Connecting...</span>
                </>
              ) : connectionStatus === "connected" ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">
                    Connected to {getDatabaseDisplayName(databaseType)}
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Connection & Query */}
          <div className="lg:col-span-1 space-y-6">
            {/* Connection Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Database Connection
                </h2>
              </div>
              <div className="p-4">
                {connectionStatus !== "connected" ? (
                  <ConnectionForm
                    onConnect={handleConnect}
                    isConnecting={connectionStatus === "connecting"}
                    isConnected={false}
                    databaseType={databaseType}
                  />
                ) : (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
                      <Wifi className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Connected to {getDatabaseDisplayName(databaseType)}{" "}
                      database
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Query Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Ask a Question
                </h2>
              </div>
              <div className="p-4">
                <QueryInterface
                  onQuery={handleQuery}
                  isQuerying={queryStatus === "querying"}
                />
              </div>
            </div>
          </div>

          {/* Right Panel - Conversation & Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Conversation Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-5 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Conversation
                </h2>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {conversation.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Your conversation will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {conversation.map((step, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg ${
                            step.type === "user"
                              ? "bg-blue-50 border border-blue-100"
                              : step.type === "agent"
                              ? "bg-gray-50 border border-gray-200"
                              : "bg-green-50 border border-green-100"
                          }`}
                        >
                          <div className="flex items-start">
                            <div
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                                step.type === "user"
                                  ? "bg-blue-500"
                                  : step.type === "agent"
                                  ? "bg-gray-500"
                                  : "bg-green-500"
                              }`}
                            >
                              {step.type === "user" ? (
                                <span className="text-white text-xs font-bold">
                                  U
                                </span>
                              ) : step.type === "agent" ? (
                                <span className="text-white text-xs font-bold">
                                  A
                                </span>
                              ) : (
                                <span className="text-white text-xs font-bold">
                                  R
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                  {step.type === "user"
                                    ? "You"
                                    : step.toolName
                                    ? step.toolName
                                    : step.type === "agent"
                                    ? "Agent"
                                    : "Result"}
                                </span>
                              </div>
                              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                {step.content}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Results Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Results</h2>
              </div>
              <div className="p-4">
                {queryResult ? (
                  <div className="space-y-6">
                    {queryResult.sql && (
                      <SQLDisplay
                        sql={queryResult.sql}
                        executionTime={queryResult.executionTime}
                        databaseType={queryResult.databaseType}
                      />
                    )}
                    {queryResult.data && queryResult.data.length > 0 && (
                      <ResultsTable
                        data={queryResult.data}
                        totalRows={queryResult.data.length}
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Query results will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
