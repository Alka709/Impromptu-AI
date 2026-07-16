import logging

from langchain_core.output_parsers import JsonOutputParser

from ai.llm import get_llm
from prompts.coach_prompt import build_prompt

logger = logging.getLogger(__name__)


class CoachAgent:
    def __init__(self):
        self.llm = get_llm()
        self.parser = JsonOutputParser()

    def evaluate(self, metrics: dict, past_sessions: list) -> dict:
        try:
            prompt, variables = build_prompt(metrics, past_sessions)

            chain = prompt | self.llm | self.parser

            response = chain.invoke(variables)

            return response

        except Exception as e:
            logger.exception("Failed to evaluate speech with LangChain")

            return {
                "summary": "Evaluation failed to parse.",
                "strengths": [],
                "weaknesses": [],
                "improvementTips": [],
                "overallScore": 0.0,
            }