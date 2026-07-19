import logging

from langchain_core.output_parsers import JsonOutputParser

from ai.llm import get_llm
from prompts.delivery_prompt import build_prompt

logger = logging.getLogger(__name__)


class DeliveryAgent:
    def __init__(self):
        self.llm = get_llm()
        self.parser = JsonOutputParser()

    def evaluate(self, delivery_metrics: dict) -> dict:
        try:
            prompt, variables = build_prompt(delivery_metrics)

            chain = prompt | self.llm | self.parser

            response = chain.invoke(variables)

            return response

        except Exception as e:
            logger.exception("Failed to evaluate delivery with LangChain")

            return {
                "deliveryScore": 0.0,
                "strengths": [],
                "weaknesses": [],
                "feedback": "Delivery evaluation failed to parse.",
            }
