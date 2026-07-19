import json


def build_past_context(past_sessions: list) -> str:
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