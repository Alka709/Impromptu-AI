import logging

from langchain_core.output_parsers import JsonOutputParser

from ai.llm import get_llm
from prompts.overall_coach_prompt import build_prompt

logger = logging.getLogger(__name__)


class OverallCoach:
    def __init__(self):
        self.llm = get_llm()
        self.parser = JsonOutputParser()

    def evaluate(
        self,
        delivery_report: dict,
        content_report: dict,
        history: dict,
    ) -> dict:
        try:
            prompt, variables = build_prompt(
                delivery_report,
                content_report,
                history,
            )

            chain = prompt | self.llm | self.parser

            response = chain.invoke(variables)

            return response

        except Exception as e:
            logger.exception("Failed to evaluate overall coach with LangChain")

            return {
                "summary": "Evaluation failed to parse.",
                "strengths": [],
                "weaknesses": [],
                "improvementTips": [],
                "overallScore": 0.0,
            }
