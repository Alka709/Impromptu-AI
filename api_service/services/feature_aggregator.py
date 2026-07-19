"""
Reorganize extract_all_metrics() output for the multi-agent pipeline.

No AI reasoning.
No new calculations.
Only reorganizes the existing metrics.
"""

from typing import Any


def aggregate(
    metrics: dict,
    topic: str,
    history: list,
) -> dict[str, Any]:
    """
    Split the output of extract_all_metrics() into the inputs required
    by the specialized AI agents.

    Returns:
    {
        "delivery": {...},
        "content": {...},
        "history": {...}
    }
    """

    # Copy the metrics so we never mutate the original dictionary.
    delivery = metrics.copy()

    # These belong to the Content Agent, not the Delivery Agent.
    transcript = delivery.pop("transcript", "")

    # Internal metadata that should never be sent to an LLM.
    delivery.pop("errors", None)

    content = {
        "topic": topic,
        "transcript": transcript,
    }

    history_context = {
        "past_sessions": history or [],
    }

    return {
        "delivery": delivery,
        "content": content,
        "history": history_context,
    }