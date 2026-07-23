import json

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from speech_analysis.utils import NumpyEncoder


def build_prompt(content_features: dict):
    """
    Returns a LangChain ChatPromptTemplate and its variables for content evaluation.
    """

    parser = JsonOutputParser()

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """
You are an expert speech content coach.

Evaluate ONLY the content of the impromptu speech based on the transcript and topic.
Focus exclusively on:
- topic relevance
- structure
- vocabulary
- grammar
- coherence

Do NOT evaluate delivery metrics such as fillers, pauses, pitch, energy,
pronunciation, or speech rate.

Be strict and provide a true, concise review.

Return a JSON object with exactly these keys:
- contentScore: float (0-10)
- relevanceScore: float (0-10)
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
Content Features (JSON):

{content_features}
""",
            ),
        ]
    )

    prompt = prompt.partial(
        format_instructions=parser.get_format_instructions()
    )

    return prompt, {
        "content_features": json.dumps(
            content_features,
            cls=NumpyEncoder,
            indent=2,
        ),
    }
