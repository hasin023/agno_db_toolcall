from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
# from urllib.parse import urlparse
import os
import time
from dotenv import load_dotenv

from agno.agent import Agent
from agno.models.openai import OpenAIChat
# from agno.tools.postgres import PostgresTools
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
    conn_str: str  # e.g., postgresql://user:password@localhost:5432/dbname

class QueryRequest(BaseModel):
    session_id: str
    prompt: str

# --- Helper Function ---
# def parse_postgres_url(conn_str: str) -> dict:
#     """Parse PostgreSQL connection string and return connection parameters"""
#     parsed = urlparse(conn_str)
#     return {
#         'host': parsed.hostname or 'localhost',
#         'port': parsed.port or 5432,
#         'db_name': parsed.path.lstrip('/'),
#         'user': parsed.username,
#         'password': parsed.password
#     }

def normalize_conn_str(conn_str: str) -> str:
    if conn_str.startswith("postgres://"):
        conn_str = conn_str.replace("postgres://", "postgresql://", 1)
    return conn_str

# --- Endpoints ---

@app.post("/api/connect")
def connect_db(req: ConnectRequest):

    conn_str = normalize_conn_str(req.conn_str)
    try:
        # postgres_tools = PostgresTools(
        #     host=conn_params['host'],
        #     port=conn_params['port'],
        #     db_name=conn_params['db_name'],
        #     user=conn_params['user'],
        #     password=conn_params['password']
        # )
        
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
        active_agents[session_id] = agent

        return {"session_id": session_id, "message": "Connected successfully"}
    
    except Exception as e:
        print(f"Error connecting to database: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/query")
def run_query(req: QueryRequest):
    if req.session_id not in active_agents:
        raise HTTPException(status_code=404, detail="Session not found. Connect first.")

    agent = active_agents[req.session_id]

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
            "execution_time": round(execution_time, 2)
        }
    except Exception as e:
        print(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
def health_check():
    return {"status": "Okee"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=8000)