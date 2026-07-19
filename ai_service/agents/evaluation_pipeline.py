from agents.delivery_agent import DeliveryAgent
from agents.content_agent import ContentAgent
from agents.overall_coach import OverallCoach
from services.feature_aggregator import aggregate


class EvaluationPipeline:
    """
    Orchestrates the complete AI evaluation workflow.

    Flow:
        Raw Metrics
            ↓
        Feature Aggregator
            ↓
        Delivery Agent
            ↓
        Content Agent
            ↓
        Overall Coach
            ↓
        Final Evaluation
    """

    def __init__(self):
        self.delivery_agent = DeliveryAgent()
        self.content_agent = ContentAgent()
        self.overall_coach = OverallCoach()

    def evaluate(
        self,
        metrics: dict,
        topic: str,
        history: list,
    ) -> dict:
        """
        Executes the complete multi-agent evaluation pipeline.

        Args:
            metrics: Output of extract_all_metrics().
            topic: Speech topic.
            history: Previous sessions fetched from Express.

        Returns:
            Final evaluation compatible with the existing webhook payload.
        """

        # Step 1: Organize inputs for specialized agents
        aggregated = aggregate(
            metrics=metrics,
            topic=topic,
            history=history,
        )

        # Step 2: Delivery evaluation
        delivery_report = self.delivery_agent.evaluate(
            aggregated["delivery"]
        )

        # Step 3: Content evaluation
        content_report = self.content_agent.evaluate(
            aggregated["content"]
        )

        # Step 4: Final coaching evaluation
        final_report = self.overall_coach.evaluate(
            delivery_report=delivery_report,
            content_report=content_report,
            history=aggregated["history"],
        )

        return final_report