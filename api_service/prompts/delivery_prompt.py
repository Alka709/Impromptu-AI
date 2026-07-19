import json

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from speech_analysis.utils import NumpyEncoder


def build_prompt(delivery_metrics: dict):
    """
    Returns a LangChain ChatPromptTemplate and its variables for delivery evaluation.
    """

    parser = JsonOutputParser()

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """
You are an expert speech delivery coach.

Evaluate the user's delivery using the provided speech metrics.
Interpret the deterministic metrics to provide coaching feedback.
Do not calculate new speech metrics.

Do NOT evaluate topic relevance, vocabulary, grammar, or content structure.

Be strict and provide a true, concise review.

Return a JSON object with exactly these keys:
- deliveryScore: float (0-10)
- strengths: list of strings
- weaknesses: list of strings
- feedback: string

Follow these formatting instructions exactly:

{format_instructions}

""",
            ),
            (
                "human",
                """
Delivery Metrics (JSON):

{delivery_metrics}
""",
            ),
        ]
    )

    prompt = prompt.partial(
        format_instructions=parser.get_format_instructions()
    )

    return prompt, {
        "delivery_metrics": json.dumps(
            delivery_metrics,
            cls=NumpyEncoder,
            indent=2,
        ),
    }
