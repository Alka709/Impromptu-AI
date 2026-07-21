const { logs, SeverityNumber } = require('@opentelemetry/api-logs');
const { LoggerProvider, BatchLogRecordProcessor } = require('@opentelemetry/sdk-logs');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');
const { resourceFromAttributes } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions') || {};

const resource = resourceFromAttributes({
  ['service.name']: 'impromptu-ai-backend',
});

const logExporter = new OTLPLogExporter({
  url: process.env.OTLP_ENDPOINT 
       ? process.env.OTLP_ENDPOINT.replace('v1/traces', 'v1/logs') 
       : "http://localhost:4319/v1/logs",
});

const loggerProvider = new LoggerProvider({
  resource,
  processors: [new BatchLogRecordProcessor(logExporter)]
});

logs.setGlobalLoggerProvider(loggerProvider);
const otelLogger = logs.getLogger('backend-logger');

const mapLevelToSeverity = (level) => {
  switch (level.toLowerCase()) {
    case 'debug': return SeverityNumber.DEBUG;
    case 'info': return SeverityNumber.INFO;
    case 'warn': return SeverityNumber.WARN;
    case 'error': return SeverityNumber.ERROR;
    case 'fatal': return SeverityNumber.FATAL;
    default: return SeverityNumber.UNSPECIFIED;
  }
};

class Logger {
  log(level, body, attributes = {}) {
    otelLogger.emit({
      severityNumber: mapLevelToSeverity(level),
      severityText: level.toUpperCase(),
      body: body,
      attributes: {
        ...attributes,
        severity: level.toUpperCase(),
      },
    });
    console.log(`[${level.toUpperCase()}] ${body}`, Object.keys(attributes).length ? attributes : '');
  }

  info(body, attributes) { this.log('info', body, attributes); }
  warn(body, attributes) { this.log('warn', body, attributes); }
  error(body, attributes) { this.log('error', body, attributes); }
  debug(body, attributes) { this.log('debug', body, attributes); }
}

module.exports = new Logger();
