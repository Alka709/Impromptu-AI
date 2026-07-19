import json

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from speech_analysis.utils import NumpyEncoder
from prompts.prompt_utils import build_past_context


def build_prompt(
    delivery_report: dict,
    content_report: dict,
    history: dict,
):
    """
    Returns a LangChain ChatPromptTemplate and its variables for the overall coach.
    """

    parser = JsonOutputParser()
    past_sessions = history.get("past_sessions", []) if isinstance(history, dict) else []

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """
You are the lead coaching agent.

You will receive:

1. A delivery evaluation.
2. A content evaluation.
3. Previous sessions.

Do NOT independently evaluate the speech again.

Your responsibility is ONLY to combine these reports into one final coaching report.

The goal is to assess confidence, articulation, fluency,
and how much less nervous or hesitant the speaker was.

Be strict and provide a true, concise review.

Compare the current performance against previous sessions when available.

Return a JSON object with exactly these keys:
- summary: string
- strengths: list of strings
- weaknesses: list of strings
- improvementTips: list of strings
- overallScore: float (0-10)

Follow these formatting instructions exactly:

{format_instructions}

""",
            ),
            (
                "human",
                """
Delivery Report (JSON):

{delivery_report}

Content Report (JSON):

{content_report}

{past_context}
""",
            ),
        ]
    )

    prompt = prompt.partial(
        format_instructions=parser.get_format_instructions()
    )

    return prompt, {
        "delivery_report": json.dumps(
            delivery_report,
            cls=NumpyEncoder,
            indent=2,
        ),
        "content_report": json.dumps(
            content_report,
            cls=NumpyEncoder,
            indent=2,
        ),
        "past_context": build_past_context(past_sessions),
    }
