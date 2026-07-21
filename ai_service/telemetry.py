import os
import logging
from opentelemetry._logs import set_logger_provider
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.exporter.otlp.proto.http._log_exporter import OTLPLogExporter
from opentelemetry.sdk.resources import Resource

def setup_telemetry():
    resource = Resource.create({
        "service.name": "impromptu-ai-service",
    })

    # Logging setup
    logger_provider = LoggerProvider(resource=resource)
    set_logger_provider(logger_provider)

    endpoint = os.environ.get("OTLP_ENDPOINT", "http://localhost:4319/v1/logs")
    log_endpoint = endpoint.replace('v1/traces', 'v1/logs') if 'v1/traces' in endpoint else endpoint
    
    log_exporter = OTLPLogExporter(endpoint=log_endpoint)
    logger_provider.add_log_record_processor(BatchLogRecordProcessor(log_exporter))

    handler = LoggingHandler(level=logging.NOTSET, logger_provider=logger_provider)
    
    # Configure root logger
    logging.basicConfig(level=logging.INFO, handlers=[handler, logging.StreamHandler()])

    logger = logging.getLogger("impromptu-ai-service")
    logger.setLevel(logging.INFO)
    return logger

logger = setup_telemetry()
