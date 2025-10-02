from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import time
import re
from urllib.parse import urlparse
from dotenv import load_dotenv

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.sql import SQLTools

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

active_agents = {}

# --- Request Models ---
class ConnectRequest(BaseModel):
    # postgresql://user:password@localhost:5432/dbname
    # mysql://user:password@localhost:3306/dbname
    # sqlite:///path/to/database.db or sqlite:///:memory:
    conn_str: str  

class QueryRequest(BaseModel):
    session_id: str
    prompt: str

# --- Helper Functions ---
def normalize_conn_str(conn_str: str) -> str:
    """Normalize connection string for compatibility"""
    if conn_str.startswith("postgres://"):
        conn_str = conn_str.replace("postgres://", "postgresql://", 1)
    return conn_str

def get_database_type(conn_str: str) -> str:
    """Extract database type from connection string"""
    parsed = urlparse(conn_str)
    scheme = parsed.scheme.lower()
    
    if scheme.startswith('postgresql'):
        return 'postgresql'
    elif scheme.startswith('mysql'):
        return 'mysql'
    elif scheme.startswith('sqlite'):
        return 'sqlite'
    else:
        return scheme

def validate_connection_string(conn_str: str) -> bool:
    """Validate if the connection string is supported"""
    supported_schemes = ["postgresql", "mysql", "sqlite"]
    pattern = re.compile(r'^(postgresql|mysql|sqlite)://')
    return bool(pattern.match(conn_str))

# --- Endpoints ---

@app.post("/api/connect")
def connect_db(req: ConnectRequest):
    conn_str = normalize_conn_str(req.conn_str)
    
    if not validate_connection_string(conn_str):
        raise HTTPException(
            status_code=400, 
            detail="Unsupported database type. Supported types: postgresql, mysql, sqlite"
        )

    try:
        db_type = get_database_type(conn_str)        
        sql_tools = SQLTools(db_url=conn_str)

        agent = Agent(
            model=OpenAIChat(
                api_key=os.getenv("OPENAI_API_KEY"),
                id=os.getenv("LLM_MODEL", "o4-mini-2025-04-16"),
            ),
            tools=[sql_tools],
            show_tool_calls=True,
            markdown=True,
        )

        session_id = str(hash(req.conn_str))
        active_agents[session_id] = {
            "agent": agent,
            "db_type": db_type,
            "conn_str": conn_str
        }

        return {
            "session_id": session_id, 
            "message": "Connected successfully",
            "database_type": db_type
        }
    
    except Exception as e:
        print(f"Error connecting to database: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/query")
def run_query(req: QueryRequest):
    if req.session_id not in active_agents:
        raise HTTPException(status_code=404, detail="Session not found. Connect first.")

    session_data = active_agents[req.session_id]
    agent = session_data["agent"]
    db_type = session_data["db_type"]

    try:
        start_time = time.time()
        response = agent.run(req.prompt)
        execution_time = (time.time() - start_time) * 1000   

        print(f"Response: {response}")
        tool_calls_info = []
        sql_query = None
        
        if hasattr(response, 'tools') and response.tools:
            for tool_execution in response.tools:
                tool_info = {
                    "name": getattr(tool_execution, 'tool_name', 'unknown'),
                    "arguments": getattr(tool_execution, 'tool_args', {}),
                    "result": getattr(tool_execution, 'result', None)
                }
                
                if tool_info["name"] == "run_sql_query" and "query" in tool_info["arguments"]:
                    tool_info["sql"] = tool_info["arguments"]["query"]
                    if not sql_query:
                        sql_query = tool_info["sql"]
                        
                tool_calls_info.append(tool_info)
        
        elif hasattr(response, 'tool_calls') and response.tool_calls:
            if isinstance(response.tool_calls, list):
                for tool_call in response.tool_calls:
                    if isinstance(tool_call, dict):
                        tool_info = {
                            "name": tool_call.get("function", {}).get("name", "unknown"),
                            "arguments": tool_call.get("function", {}).get("arguments", {}),
                        }
                        if tool_info["name"] == "run_sql_query" and "query" in tool_info["arguments"]:
                            tool_info["sql"] = tool_info["arguments"]["query"]
                            if not sql_query:
                                sql_query = tool_info["arguments"]["query"]
                        tool_calls_info.append(tool_info)
        
        content = ""
        if hasattr(response, 'content'):
            content = response.content
        elif isinstance(response, str):
            content = response
        else:
            content = str(response)
            
        return {
            "prompt": req.prompt,
            "response": content,
            "sql": sql_query,
            "tool_calls": tool_calls_info,
            "execution_time": round(execution_time, 2),
            "database_type": db_type
        }
    except Exception as e:
        print(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
def health_check():
    return {"status": "OK"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)