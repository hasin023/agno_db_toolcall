import os
from dotenv import load_dotenv
from pathlib import Path
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.csv_toolkit import CsvTools

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
LLM_MODEL = os.getenv("LLM_MODEL")

local_csv_path = Path(__file__).parent / "data" / "automobile_data.csv"

if not local_csv_path.exists():
    raise FileNotFoundError(f"CSV file not found at: {local_csv_path}")

agent = Agent(
    model=OpenAIChat(api_key=OPENAI_API_KEY, id=LLM_MODEL),
    tools=[CsvTools(csvs=[local_csv_path])],
    markdown=True,
    show_tool_calls=True,
    instructions=[
        "First always get the list of files",
        "Then check the columns in the file",
        "Then run the query to answer the question",
        "Always wrap column names with double quotes if they contain spaces or special characters",
        "Remember to escape the quotes in the JSON string (use \")",
        "Use single quotes for string values"
    ],
)

agent.cli_app(stream=True)