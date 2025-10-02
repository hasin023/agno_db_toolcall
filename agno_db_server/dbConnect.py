import os
from dotenv import load_dotenv
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
LLM_MODEL = os.getenv("LLM_MODEL")

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.postgres import PostgresTools

# Initialize PostgresTools with connection details
postgres_tools = PostgresTools(
    host="localhost",
    port=5432,
    db_name="agnodb",
    user="postgres",
    password="pgadmin"
)

# Create an agent with the PostgresTools
agent = Agent(
    model=OpenAIChat(api_key=OPENAI_API_KEY, id=LLM_MODEL),
    tools=[
          postgres_tools,
        ],
    show_tool_calls=True,
    markdown=True,
)

# agent.print_response("What are all the tables in the database?")
# agent.print_response("What are all the products available in the database?")
agent.print_response("Show me the best-selling products and their revenue for this year, grouped by category.")