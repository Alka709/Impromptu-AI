import logging

from langchain_core.output_parsers import JsonOutputParser

from ai.llm import get_llm
from prompts.content_prompt import build_prompt

logger = logging.getLogger(__name__)


class ContentAgent:
    def __init__(self):
        self.llm = get_llm()
        self.parser = JsonOutputParser()

    def evaluate(self, content_features: dict) -> dict:
        try:
            prompt, variables = build_prompt(content_features)

            chain = prompt | self.llm | self.parser

            response = chain.invoke(variables)

            return response

        except Exception as e:
            logger.exception("Failed to evaluate content with LangChain")

            return {
                "contentScore": 0.0,
                "relevanceScore": 0.0,
                "strengths": [],
                "weaknesses": [],
                "feedback": "Content evaluation failed to parse.",
            }
