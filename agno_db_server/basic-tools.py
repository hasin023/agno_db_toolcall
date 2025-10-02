import os
import requests
from dotenv import load_dotenv
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
LLM_MODEL = os.getenv("LLM_MODEL")
API_NINJA_KEY = os.getenv("API_NINJA_KEY")

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools import tool
from agno.tools.shell import ShellTools

@tool(show_result=True, stop_after_tool_call=True)
def get_horoscope(sign: str) -> dict:
    """
    Fetches today's horoscope for the specified zodiac sign using API Ninjas.
    Requires: X-Api-Key header with your API key.
    """
    url = "https://api.api-ninjas.com/v1/horoscope"
    headers = { "X-Api-Key": API_NINJA_KEY }
    params = { "zodiac": sign.lower() }
    resp = requests.get(url, headers=headers, params=params)
    resp.raise_for_status()
    return resp.json()

agent = Agent(
    model=OpenAIChat(api_key=OPENAI_API_KEY, id=LLM_MODEL),
    tools=[
          get_horoscope,
          ShellTools()
        ],
    show_tool_calls=True,
    markdown=True,
)

agent.print_response("What is my horoscope? I am a Taurus.", stream=True)
agent.print_response("Show me the contents of the current directory", stream=True)