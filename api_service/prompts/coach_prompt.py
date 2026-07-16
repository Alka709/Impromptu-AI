import json

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from speech_analysis.utils import NumpyEncoder


def _build_past_context(past_sessions: list) -> str:
    """
    Converts previous session history into a readable context block.
    """

    if not past_sessions:
        return ""

    past_context = "User's past performance in last 3 sessions:\n"

    for session in past_sessions:
        weaknesses = session.get("weaknesses")
        if isinstance(weaknesses, str):
            try:
                parsed = json.loads(weaknesses)
                if isinstance(parsed, list):
                    weaknesses = ", ".join(parsed)
            except Exception:
                pass
        elif isinstance(weaknesses, list):
            weaknesses = ", ".join(weaknesses)

        tips = session.get("improvement_tips")
        if isinstance(tips, str):
            try:
                parsed = json.loads(tips)
                if isinstance(parsed, list):
                    tips = ", ".join(parsed)
            except Exception:
                pass
        elif isinstance(tips, list):
            tips = ", ".join(tips)

        past_context += (
            f"- Score: {session.get('overall_score')}/10, "
            f"Weaknesses: {weaknesses}, "
            f"Tips: {tips}\n"
        )

    return past_context


def build_prompt(metrics: dict, past_sessions: list):
    """
    Returns a LangChain ChatPromptTemplate and its variables.
    """

    parser = JsonOutputParser()

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """
You are an expert speech and communication coach.

Evaluate the following impromptu speech.

The goal is to assess confidence, articulation, fluency,
and how much less nervous or hesitant the speaker was.

Be strict and provide a true, concise review.

Compare the current performance against previous sessions when available.

Follow these formatting instructions exactly:

{format_instructions}

""",
            ),
            (
                "human",
                """
Current Session Metrics (JSON):

{metrics}

{past_context}
""",
            ),
        ]
    )

    prompt = prompt.partial(
    format_instructions=parser.get_format_instructions()
)

    return prompt, {
        "metrics": json.dumps(
            metrics,
            cls=NumpyEncoder,
            indent=2,
        ),
        "past_context": _build_past_context(past_sessions),
    }