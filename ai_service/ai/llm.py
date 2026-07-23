import os

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv(override=True)

_llm = None


def get_llm():
    """
    Returns a singleton ChatGoogleGenerativeAI instance.
    """

    global _llm

    if _llm is None:
        _llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash-latest",
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.2,
            max_retries=6,
        )

    return _llm